const pool = require("../config/db");

// GET /api/memberships
async function getMemberships(req, res) {
  try {
    const { memberId = "", page = "1", limit = "20" } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    if (memberId) {
      params.push(memberId);
      conditions.push(`m.user_id = $${params.length}`);
    }

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
    params.push(parseInt(limit), offset);

    const { rows: memberships } = await pool.query(`
      SELECT m.*, u.full_name, u.email, p.name AS plan_name, p.price_etb, p.billing_cycle
      FROM memberships m
      JOIN users u ON u.id = m.user_id
      JOIN plans p ON p.id = m.plan_id
      ${where}
      ORDER BY m.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    const countParams = params.slice(0, params.length - 2);
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM memberships m ${where}`, countParams
    );
    const total = parseInt(countRows[0].count);

    res.json({ success: true, data: { memberships, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// POST /api/memberships
async function createMembership(req, res) {
  try {
    const { userId, planId, startDate, endDate, batch = "MORNING" } = req.body;
    if (!userId || !planId || !startDate || !endDate)
      return res.status(400).json({ success: false, message: "userId, planId, startDate, endDate required" });

    const { rows } = await pool.query(
      `INSERT INTO memberships (user_id, plan_id, start_date, end_date, batch, fee_status)
       VALUES ($1,$2,$3,$4,$5,'UNPAID') RETURNING *`,
      [userId, planId, startDate, endDate, batch]
    );

    await pool.query(
      "INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id, new_value) VALUES ($1,$2,$3,$4,$5,$6)",
      [req.user.id, req.user.email, "MEMBERSHIP_CREATED", "membership", rows[0].id,
       JSON.stringify({ userId, planId, startDate, endDate })]
    );

    res.status(201).json({ success: true, data: { membership: rows[0] }, message: "Membership created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// GET /api/memberships/plans  — return available plans for dropdowns
async function getPlans(_req, res) {
  try {
    const { rows } = await pool.query("SELECT * FROM plans WHERE is_active=TRUE ORDER BY price_etb ASC");
    res.json({ success: true, data: { plans: rows } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { getMemberships, createMembership, getPlans };