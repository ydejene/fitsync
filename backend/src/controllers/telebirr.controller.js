/**
 * @fileoverview Telebirr Payment Controller
 * Handles payment initiation, webhook processing, and status checking
 * for the B2B subscription payment flow.
 *
 * Endpoints:
 *  POST /api/telebirr/initiate   – Start a telebirr payment (authenticated)
 *  POST /api/telebirr/webhook    – Receive payment notification (no auth)
 *  GET  /api/telebirr/status/:id – Check payment status (authenticated)
 *
 * @module controllers/telebirr
 */

const pool = require("../config/db");
const telebirrService = require("../services/telebirr.service");

/**
 * POST /api/telebirr/initiate
 * Initiates a telebirr B2B payment for a subscription plan.
 *
 * Request body: { planId: UUID }
 * Response: { success: true, data: { checkoutUrl, merchOrderId } }
 *
 * Flow:
 * 1. Validate plan exists and is active
 * 2. Generate unique merchant order ID
 * 3. Create pending telebirr_transaction record
 * 4. Call telebirr API to create order and get checkout URL
 * 5. Return checkout URL for frontend redirect
 */
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

    // Create pending telebirr transaction record
    await client.query(
      `INSERT INTO telebirr_transactions
        (user_id, subscription_plan_id, merch_order_id, total_amount, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [userId, planId, merchOrderId, plan.price_etb]
    );

    // Call Telebirr API: get token → create order → generate checkout URL
    let orderResult;
    try {
      orderResult = await telebirrService.createOrder({
        title,
        amount,
        merchOrderId,
      });
    } catch (apiErr) {
      // Catch specific Ethio Telecom Sandbox outage (Southbound service unavailable)
      if (apiErr.message?.includes("49401024991")) {
        await client.query("ROLLBACK");
        return res.status(503).json({
          success: false,
          message: "Telebirr Sandbox service is currently unavailable. This is an external issue with Ethio Telecom. Please try again in 5 minutes.",
          code: "TELEBIRR_SANDBOX_DOWN"
        });
      }
      throw apiErr; // Let the main catch block handle other errors
    }

    // Update transaction with prepay_id and API response
    await client.query(
      `UPDATE telebirr_transactions
       SET prepay_id = $1, response_payload = $2, updated_at = NOW()
       WHERE merch_order_id = $3`,
      [orderResult.prepayId, JSON.stringify(orderResult.rawResponse), merchOrderId]
    );

    const checkoutUrl = telebirrService.generateCheckoutUrl(orderResult.prepayId);

    await client.query("COMMIT");

    // Audit log: payment initiated
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

/**
 * POST /api/telebirr/webhook
 * Receives payment confirmation from the Telebirr server.
 * This endpoint has NO authentication — it's called server-to-server by Telebirr.
 *
 * Expected body fields (per Telebirr docs):
 *  - merch_order_id, payment_order_id, total_amount, trade_status,
 *    trans_currency, sign, sign_type, etc.
 *
 * On success:
 * 1. Updates telebirr_transaction status to 'success'
 * 2. Creates a payment record in the payments table
 * 3. Activates the user's subscription (subscription_status → 'active')
 * 4. Creates an audit log entry
 */
async function handleWebhook(req, res) {
  const client = await pool.connect();
  try {
    const webhookData = req.body;
    const { merch_order_id, trade_status, payment_order_id } = webhookData;

    if (!merch_order_id) {
      return res.status(400).json({ success: false, message: "Missing merch_order_id" });
    }

    // Find the corresponding transaction
    const txResult = await client.query(
      "SELECT * FROM telebirr_transactions WHERE merch_order_id = $1",
      [merch_order_id]
    );
    const transaction = txResult.rows[0];

    if (!transaction) {
      console.error(`Webhook: Unknown merch_order_id: ${merch_order_id}`);
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    // Skip if already processed (idempotency)
    if (transaction.status === "success") {
      return res.json({ success: true, message: "Already processed" });
    }

    await client.query("BEGIN");

    // Store raw webhook payload for audit trail
    await client.query(
      `UPDATE telebirr_transactions
       SET webhook_payload = $1, payment_order_id = $2, updated_at = NOW()
       WHERE merch_order_id = $3`,
      [JSON.stringify(webhookData), payment_order_id || null, merch_order_id]
    );

    if (trade_status === "Completed") {
      // ── Payment Successful ──

      // Update telebirr transaction status
      await client.query(
        `UPDATE telebirr_transactions SET status = 'success', updated_at = NOW()
         WHERE merch_order_id = $1`,
        [merch_order_id]
      );

      // Create a payment record in the main payments table
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

      // Link payment to telebirr transaction
      await client.query(
        "UPDATE telebirr_transactions SET payment_id = $1 WHERE merch_order_id = $2",
        [paymentResult.rows[0].id, merch_order_id]
      );

      // Fetch the subscription plan for duration calculation
      const planResult = await client.query(
        "SELECT * FROM subscription_plans WHERE id = $1",
        [transaction.subscription_plan_id]
      );
      const plan = planResult.rows[0];

      // Activate user's subscription
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

      // Audit log: subscription activated
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
      // ── Payment Failed or other status ──
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

/**
 * GET /api/telebirr/status/:merchOrderId
 * Checks the current status of a telebirr payment.
 * Used by the frontend success page to poll for confirmation.
 *
 * @param {string} req.params.merchOrderId - The merchant order ID to check
 * @returns {{ success: boolean, data: { status, subscriptionStatus } }}
 */
async function checkPaymentStatus(req, res) {
  try {
    const { merchOrderId } = req.params;
    const userId = req.user.id;

    // Fetch transaction status from our database
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

module.exports = { initiatePayment, handleWebhook, checkPaymentStatus };
