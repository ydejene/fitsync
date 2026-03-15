const pool = require("../config/db");

// GET /api/dashboard
async function getDashboardStats(_req, res) {
  try {
    const now = new Date();

    // ALGORITHM 1 — Sliding Window Time Range
    // Window: now → now + 7 days
    // Any membership whose end_date falls inside this window is "expiring soon"
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const startOfMonth    = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      { rows: [{ count: totalMembers }] },
      { rows: [{ count: activeMembers }] },
      { rows: [{ count: overdueCount }] },
      { rows: [{ count: expiringCount }] },   // ← Sliding Window result
      { rows: [{ total: mrr }] },
      { rows: [{ total: lastMrr }] },
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users WHERE role='MEMBER'"),
      pool.query("SELECT COUNT(*) FROM users WHERE role='MEMBER' AND status='ACTIVE'"),
      pool.query("SELECT COUNT(*) FROM memberships WHERE fee_status='OVERDUE'"),
      // Sliding window query — endDate BETWEEN now AND now+7days
      pool.query(
        "SELECT COUNT(*) FROM memberships WHERE end_date >= $1 AND end_date <= $2 AND fee_status != 'PAID'",
        [now, nextWeek]
      ),
      pool.query(
        "SELECT COALESCE(SUM(amount_etb),0) AS total FROM payments WHERE status='COMPLETED' AND paid_at >= $1",
        [startOfMonth]
      ),
      pool.query(
        "SELECT COALESCE(SUM(amount_etb),0) AS total FROM payments WHERE status='COMPLETED' AND paid_at >= $1 AND paid_at <= $2",
        [startOfLastMonth, endOfLastMonth]
      ),
    ]);

    const mrrNum     = parseFloat(mrr);
    const lastMrrNum = parseFloat(lastMrr);
    const churnRate  = lastMrrNum > 0
      ? parseFloat((((lastMrrNum - mrrNum) / lastMrrNum) * 100).toFixed(1))
      : 0;

    res.json({
      success: true,
      data: {
        totalMembers: parseInt(totalMembers),
        activeMembers: parseInt(activeMembers),
        overdueCount: parseInt(overdueCount),
        expiringCount: parseInt(expiringCount),
        mrr: mrrNum,
        lastMrr: lastMrrNum,
        churnRate,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { getDashboardStats };