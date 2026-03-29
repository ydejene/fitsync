const pool = require("../config/db");
const telebirrService = require("../services/telebirr.service");

// Set TELEBIRR_DEMO_MODE=true in .env to use the mock payment flow instead of live sandbox
const IS_DEMO_MODE = process.env.TELEBIRR_DEMO_MODE === "true";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// POST /api/telebirr/initiate
async function initiatePayment(req, res) {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "Subscription plan ID is required",
      });
    }

    // Fetch the selected subscription plan
    const planResult = await client.query(
      "SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true",
      [planId]
    );
    const plan = planResult.rows[0];

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found or inactive",
      });
    }

    // Generate unique merchant order ID
    const merchOrderId = telebirrService.createMerchOrderId();
    
    // Telebirr rejects special characters like hyphens (e.g., 'Half-Yearly' -> 'Half Yearly')
    const safePlanName = plan.name.replace(/[^a-zA-Z0-9 ]/g, " ").trim();
    const title = `FitSync ${safePlanName} Subscription`;
    const amount = plan.price_etb.toString();

    await client.query("BEGIN");

    await client.query(
      `INSERT INTO telebirr_transactions
        (user_id, subscription_plan_id, merch_order_id, total_amount, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [userId, planId, merchOrderId, plan.price_etb]
    );

    if (IS_DEMO_MODE) {
      const mockCheckoutUrl = `${FRONTEND_URL}/payment/mock?merchOrderId=${merchOrderId}&amount=${plan.price_etb}&planName=${encodeURIComponent(plan.name)}`;
      
      await client.query(
        `UPDATE telebirr_transactions
         SET response_payload = $1, updated_at = NOW()
         WHERE merch_order_id = $2`,
        [JSON.stringify({ mode: "DEMO_MOCK_INITIATED" }), merchOrderId]
      );

      await client.query("COMMIT");

      return res.json({
        success: true,
        message: "Payment initiated (Demo Mode)",
        data: { checkoutUrl: mockCheckoutUrl, merchOrderId },
      });
    }

    let orderResult;
    try {
      orderResult = await telebirrService.createOrder({ title, amount, merchOrderId });
    } catch (apiErr) {
      // Error code 49401024991 = Ethio Telecom sandbox is down
      if (apiErr.message?.includes("49401024991")) {
        await client.query("ROLLBACK");
        return res.status(503).json({
          success: false,
          message: "Telebirr Sandbox service is currently unavailable. This is an external issue with Ethio Telecom. Please try again in 5 minutes.",
          code: "TELEBIRR_SANDBOX_DOWN"
        });
      }
      throw apiErr;
    }

    await client.query(
      `UPDATE telebirr_transactions
       SET prepay_id = $1, response_payload = $2, updated_at = NOW()
       WHERE merch_order_id = $3`,
      [orderResult.prepayId, JSON.stringify(orderResult.rawResponse), merchOrderId]
    );

    const checkoutUrl = telebirrService.generateCheckoutUrl(orderResult.prepayId);

    await client.query("COMMIT");

    await pool.query(
      `INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id, new_value)
       VALUES ($1, $2, 'TELEBIRR_PAYMENT_INITIATED', 'telebirr_transaction', NULL,
               $3::jsonb)`,
      [userId, req.user.email, JSON.stringify({ merchOrderId, planName: plan.name, amount })]
    );

    res.json({
      success: true,
      message: "Payment initiated successfully",
      data: { checkoutUrl, merchOrderId },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Telebirr initiate error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to initiate payment. Please try again.",
    });
  } finally {
    client.release();
  }
}

// POST /api/telebirr/webhook — server-to-server, no auth
async function handleWebhook(req, res) {
  const client = await pool.connect();
  try {
    const webhookData = req.body;
    const { merch_order_id, trade_status, payment_order_id } = webhookData;

    if (!merch_order_id) {
      return res.status(400).json({ success: false, message: "Missing merch_order_id" });
    }

    const txResult = await client.query(
      "SELECT * FROM telebirr_transactions WHERE merch_order_id = $1",
      [merch_order_id]
    );
    const transaction = txResult.rows[0];

    if (!transaction) {
      console.error(`Webhook: Unknown merch_order_id: ${merch_order_id}`);
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    if (transaction.status === "success") { // idempotency guard
      return res.json({ success: true, message: "Already processed" });
    }

    await client.query("BEGIN");

    await client.query(
      `UPDATE telebirr_transactions
       SET webhook_payload = $1, payment_order_id = $2, updated_at = NOW()
       WHERE merch_order_id = $3`,
      [JSON.stringify(webhookData), payment_order_id || null, merch_order_id]
    );

    if (trade_status === "Completed") {
      await client.query(
        `UPDATE telebirr_transactions SET status = 'success', updated_at = NOW()
         WHERE merch_order_id = $1`,
        [merch_order_id]
      );

      const paymentResult = await client.query(
        `INSERT INTO payments (user_id, amount_etb, payment_method, transaction_ref, status, notes)
         VALUES ($1, $2, 'TELEBIRR', $3, 'COMPLETED', $4)
         RETURNING id`,
        [
          transaction.user_id,
          transaction.total_amount,
          payment_order_id || merch_order_id,
          `Telebirr B2B subscription payment - Order: ${merch_order_id}`,
        ]
      );

      await client.query(
        "UPDATE telebirr_transactions SET payment_id = $1 WHERE merch_order_id = $2",
        [paymentResult.rows[0].id, merch_order_id]
      );

      const planResult = await client.query(
        "SELECT * FROM subscription_plans WHERE id = $1",
        [transaction.subscription_plan_id]
      );
      const plan = planResult.rows[0];

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (plan ? plan.duration_days : 30));

      await client.query(
        `UPDATE users
         SET subscription_status = 'active',
             subscription_plan_id = $1,
             subscription_start = $2,
             subscription_end = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [transaction.subscription_plan_id, startDate, endDate, transaction.user_id]
      );

      await client.query(
        `INSERT INTO audit_logs (actor_id, action, entity_type, new_value)
         VALUES ($1, 'SUBSCRIPTION_ACTIVATED', 'user',
                 $2::jsonb)`,
        [
          transaction.user_id,
          JSON.stringify({
            merchOrderId: merch_order_id,
            planName: plan?.name,
            subscriptionEnd: endDate.toISOString(),
          }),
        ]
      );
    } else {
      await client.query(
        `UPDATE telebirr_transactions SET status = 'failed', updated_at = NOW()
         WHERE merch_order_id = $1`,
        [merch_order_id]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Webhook processed" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Telebirr webhook error:", err);
    res.status(500).json({ success: false, message: "Webhook processing failed" });
  } finally {
    client.release();
  }
}

// GET /api/telebirr/status/:merchOrderId — polled by the frontend success page
async function checkPaymentStatus(req, res) {
  try {
    const { merchOrderId } = req.params;
    const userId = req.user.id;

    const txResult = await pool.query(
      `SELECT tt.status AS payment_status, tt.merch_order_id,
              u.subscription_status, u.subscription_end
       FROM telebirr_transactions tt
       JOIN users u ON u.id = tt.user_id
       WHERE tt.merch_order_id = $1 AND tt.user_id = $2`,
      [merchOrderId, userId]
    );

    if (txResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    const tx = txResult.rows[0];

    res.json({
      success: true,
      data: {
        paymentStatus:      tx.payment_status,
        subscriptionStatus: tx.subscription_status,
        subscriptionEnd:    tx.subscription_end,
        merchOrderId:       tx.merch_order_id,
      },
    });
  } catch (err) {
    console.error("Check payment status error:", err);
    res.status(500).json({ success: false, message: "Failed to check payment status" });
  }
}

// POST /api/telebirr/mock-payment — demo mode only, mirrors webhook logic
async function handleMockPayment(req, res) {
  if (!IS_DEMO_MODE) {
    return res.status(403).json({ success: false, message: "Demo mode is not enabled" });
  }

  const client = await pool.connect();
  try {
    const { merchOrderId } = req.body;
    if (!merchOrderId) {
      return res.status(400).json({ success: false, message: "Missing merchOrderId" });
    }

    const txResult = await client.query(
      "SELECT * FROM telebirr_transactions WHERE merch_order_id = $1",
      [merchOrderId]
    );
    const transaction = txResult.rows[0];

    if (!transaction || transaction.status === "success") {
      return res.json({ success: true, message: "Already processed or invalid" });
    }

    await client.query("BEGIN");

    await client.query(
      `UPDATE telebirr_transactions SET status = 'success', updated_at = NOW()
       WHERE merch_order_id = $1`,
      [merchOrderId]
    );

    const paymentResult = await client.query(
      `INSERT INTO payments (user_id, amount_etb, payment_method, transaction_ref, status, notes)
       VALUES ($1, $2, 'TELEBIRR', $3, 'COMPLETED', 'Demo Mode Simulated Payment')
       RETURNING id`,
      [transaction.user_id, transaction.total_amount, `DEMO_${merchOrderId}`]
    );

    await client.query(
      "UPDATE telebirr_transactions SET payment_id = $1 WHERE merch_order_id = $2",
      [paymentResult.rows[0].id, merchOrderId]
    );

    // 4. Activate subscription
    const planResult = await client.query(
      "SELECT duration_days, name FROM subscription_plans WHERE id = $1",
      [transaction.subscription_plan_id]
    );
    const plan = planResult.rows[0];

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (plan ? plan.duration_days : 30));

    await client.query(
      `UPDATE users
       SET subscription_status = 'active',
           subscription_plan_id = $1,
           subscription_start = NOW(),
           subscription_end = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [transaction.subscription_plan_id, endDate, transaction.user_id]
    );

    await client.query("COMMIT");
    res.json({ success: true, message: "Mock payment processed successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Mock payment error:", err);
    res.status(500).json({ success: false, message: "Failed to process mock payment" });
  } finally {
    client.release();
  }
}

module.exports = { initiatePayment, handleWebhook, checkPaymentStatus, handleMockPayment };
