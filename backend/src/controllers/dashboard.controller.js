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

// GET /api/dashboard/member — member's own dashboard data
async function getMemberDashboard(req, res) {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Current / most recent membership
    const { rows: memberships } = await pool.query(`
      SELECT m.*, p.name AS plan_name, p.price_etb, p.billing_cycle, p.duration_days, p.features
      FROM memberships m
      JOIN plans p ON p.id = m.plan_id
      WHERE m.user_id = $1
      ORDER BY m.end_date DESC
    `, [userId]);

    const activeMembership = memberships.find(
      (m) => new Date(m.end_date) >= now
    ) || memberships[0] || null;

    // Upcoming classes (booked, not cancelled, in the future)
    const { rows: upcomingClasses } = await pool.query(`
      SELECT b.id AS booking_id, b.attended, c.name, c.instructor, c.location, c.schedule_at, c.duration_min
      FROM bookings b
      JOIN classes c ON c.id = b.class_id
      WHERE b.user_id = $1 AND b.cancelled = FALSE AND c.schedule_at >= $2
      ORDER BY c.schedule_at ASC
      LIMIT 5
    `, [userId, now]);

    // Recent payments
    const { rows: recentPayments } = await pool.query(`
      SELECT p.id, p.amount_etb, p.payment_method, p.status, p.paid_at, pl.name AS plan_name
      FROM payments p
      LEFT JOIN memberships m ON m.id = p.membership_id
      LEFT JOIN plans pl ON pl.id = m.plan_id
      WHERE p.user_id = $1
      ORDER BY p.paid_at DESC
      LIMIT 5
    `, [userId]);

    // Attendance stats (last 30 days)
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { rows: [attendanceStats] } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE attended = TRUE) AS attended,
        COUNT(*) FILTER (WHERE cancelled = TRUE) AS cancelled,
        COUNT(*) AS total
      FROM bookings
      WHERE user_id = $1 AND booked_at >= $2
    `, [userId, thirtyDaysAgo]);

    // Days left on membership
    let daysLeft = null;
    if (activeMembership) {
      const end = new Date(activeMembership.end_date);
      daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    res.json({
      success: true,
      data: {
        activeMembership,
        memberships,
        daysLeft,
        upcomingClasses,
        recentPayments,
        attendance: {
          attended: parseInt(attendanceStats.attended) || 0,
          cancelled: parseInt(attendanceStats.cancelled) || 0,
          total: parseInt(attendanceStats.total) || 0,
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { getDashboardStats, getMemberDashboard };