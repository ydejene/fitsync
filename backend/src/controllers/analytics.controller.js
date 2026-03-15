const pool = require("../config/db");

async function getAnalytics(_req, res) {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      paymentsRes,
      totalMembersRes,
      activeMembersRes,
      overdueRes,
      planBreakdownRes,
      plansRes
    ] = await Promise.all([
      pool.query(
        "SELECT amount_etb, created_at, payment_method FROM payments WHERE status = 'COMPLETED' AND created_at >= $1 ORDER BY created_at ASC",
        [sixMonthsAgo]
      ),
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'MEMBER'"),
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'MEMBER' AND status = 'ACTIVE'"),
      pool.query("SELECT COUNT(*) FROM memberships WHERE fee_status = 'OVERDUE'"),
      pool.query("SELECT plan_id, COUNT(id) as count FROM memberships GROUP BY plan_id"),
      pool.query("SELECT * FROM plans")
    ]);

    const payments = paymentsRes.rows;
    const totalRevenue = payments.reduce((s, p) => s + Number(p.amount_etb), 0);
    
    const monthlyRevenue = {};
    const methodBreakdown = {};

    payments.forEach((p) => {
      const date = new Date(p.created_at);
      const key = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      
      monthlyRevenue[key] = (monthlyRevenue[key] ?? 0) + Number(p.amount_etb);
      
      if (p.payment_method) {
        methodBreakdown[p.payment_method] = (methodBreakdown[p.payment_method] ?? 0) + Number(p.amount_etb);
      }
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalMembers: parseInt(totalMembersRes.rows[0].count),
        activeMembers: parseInt(activeMembersRes.rows[0].count),
        overdue: parseInt(overdueRes.rows[0].count),
        monthlyRevenue,
        methodBreakdown,
        planBreakdown: planBreakdownRes.rows,
        plans: plansRes.rows
      }
    });
  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { getAnalytics };