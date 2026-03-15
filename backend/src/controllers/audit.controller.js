// Branch: feature/auth (audit log)  |  Owner: Abdul
const pool = require("../config/db");

// GET /api/audit
async function getAuditLogs(req, res) {
  try {
    const { page = "1", limit = "25" } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: logs } = await pool.query(`
      SELECT a.*, u.full_name AS actor_name, u.role AS actor_role
      FROM audit_logs a
      LEFT JOIN users u ON u.id = a.actor_id
      ORDER BY a.created_at DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), offset]);

    const { rows: [{ count }] } = await pool.query("SELECT COUNT(*) FROM audit_logs");

    res.json({ success: true, data: { logs, total: parseInt(count), page: parseInt(page), totalPages: Math.ceil(parseInt(count) / parseInt(limit)) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { getAuditLogs };