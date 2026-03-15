const pool = require("../config/db");

// GET /api/payments
async function getPayments(req, res) {
  try {
    const { page = "1", limit = "20", memberId = "" } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    if (memberId) {
      params.push(memberId);
      conditions.push(`p.user_id = $${params.length}`);
    }

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
    params.push(parseInt(limit), offset);

    const { rows: payments } = await pool.query(`
      SELECT p.*, u.full_name, u.email, pl.name AS plan_name
      FROM payments p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN memberships m ON m.id = p.membership_id
      LEFT JOIN plans pl ON pl.id = m.plan_id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    const countParams = params.slice(0, params.length - 2);
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM payments p ${where}`, countParams
    );
    const { rows: totals } = await pool.query(
      "SELECT COALESCE(SUM(amount_etb),0) AS total FROM payments WHERE status='COMPLETED'"
    );

    const total = parseInt(countRows[0].count);
    res.json({ success: true, data: { payments, total, totalRevenue: parseFloat(totals[0].total), page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// POST /api/payments
// ALGORITHM 2 — Atomic Transaction (BEGIN / COMMIT / ROLLBACK)
async function createPayment(req, res) {
  const client = await pool.connect();
  try {
    const { memberId, membershipId, amountEtb, paymentMethod, transactionRef, notes } = req.body;
    if (!memberId || !membershipId || !amountEtb)
      return res.status(400).json({ success: false, message: "Member, membership and amount required" });

    await client.query("BEGIN");

    // Step 1 — Insert payment record
    const { rows } = await client.query(
      `INSERT INTO payments (user_id, membership_id, amount_etb, payment_method, transaction_ref, notes, status, paid_at)
       VALUES ($1,$2,$3,$4,$5,$6,'COMPLETED',NOW()) RETURNING *`,
      [memberId, membershipId, amountEtb, paymentMethod || null, transactionRef || null, notes || null]
    );
    const payment = rows[0];

    // Step 2 — Update membership fee_status → PAID
    await client.query(
      "UPDATE memberships SET fee_status='PAID' WHERE id=$1",
      [membershipId]
    );

    // Step 3 — Audit log
    await client.query(
      `INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id, new_value)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, "PAYMENT_RECORDED", "payment", payment.id,
       JSON.stringify({ amountEtb, paymentMethod, memberId })]
    );

    await client.query("COMMIT");
    res.status(201).json({ success: true, data: { payment }, message: "Payment recorded successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error – transaction rolled back" });
  } finally {
    client.release();
  }
}

module.exports = { getPayments, createPayment };