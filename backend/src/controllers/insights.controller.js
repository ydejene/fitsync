const pool = require("../config/db");

async function getInsights(req, res) {
  try {
    const { from, to, plan_id } = req.query;

    // Default date range: last 12 months
    const dateFrom = from
      ? new Date(from)
      : new Date(new Date().setMonth(new Date().getMonth() - 12));
    const dateTo = to ? new Date(to) : new Date();

    // ── Run all queries in parallel ──
    const [
      // Demographics
      genderRes,
      ageGroupRes,
      // Membership insights
      planPopularityRes,
      activeInactiveRes,
      batchDistRes,
      feeStatusRes,
      // Payment analytics
      methodBreakdownRes,
      monthlyRevenueRes,
      revenueByPlanRes,
      // Attendance
      dailyTrafficRes,
      hourlyTrafficRes,
      weeklyTrafficRes,
      // Growth
      signupsOverTimeRes,
      churnRes,
      // KPIs
      totalMembersRes,
      activeMembersRes,
      totalRevenueRes,
      overdueCountRes,
      expiringRes,
    ] = await Promise.all([
      // ── DEMOGRAPHICS ──
      // Gender distribution
      pool.query(`
        SELECT
          COALESCE(gender, 'Unknown') as gender,
          COUNT(*)::int as count
        FROM users WHERE role = 'MEMBER'
        GROUP BY gender
        ORDER BY count DESC
      `),

      // Age groups (from dob)
      pool.query(`
        SELECT age_group, count FROM (
          SELECT
            CASE
              WHEN EXTRACT(YEAR FROM AGE(NOW(), dob)) < 18 THEN 'Under 18'
              WHEN EXTRACT(YEAR FROM AGE(NOW(), dob)) BETWEEN 18 AND 25 THEN '18-25'
              WHEN EXTRACT(YEAR FROM AGE(NOW(), dob)) BETWEEN 26 AND 35 THEN '26-35'
              WHEN EXTRACT(YEAR FROM AGE(NOW(), dob)) BETWEEN 36 AND 45 THEN '36-45'
              WHEN EXTRACT(YEAR FROM AGE(NOW(), dob)) BETWEEN 46 AND 55 THEN '46-55'
              WHEN EXTRACT(YEAR FROM AGE(NOW(), dob)) > 55 THEN '55+'
              ELSE 'Unknown'
            END as age_group,
            COUNT(*)::int as count
          FROM users
          WHERE role = 'MEMBER' AND dob IS NOT NULL
          GROUP BY 1
        ) sub
        ORDER BY
          CASE age_group
            WHEN 'Under 18' THEN 1
            WHEN '18-25' THEN 2
            WHEN '26-35' THEN 3
            WHEN '36-45' THEN 4
            WHEN '46-55' THEN 5
            WHEN '55+' THEN 6
            ELSE 7
          END
      `),

      // ── MEMBERSHIP INSIGHTS ──
      // Plan popularity
      pool.query(`
        SELECT p.name as plan_name, p.billing_cycle, COUNT(m.id)::int as count
        FROM memberships m
        JOIN plans p ON p.id = m.plan_id
        ${plan_id ? "WHERE m.plan_id = $1" : ""}
        GROUP BY p.name, p.billing_cycle
        ORDER BY count DESC
      `, plan_id ? [plan_id] : []),

      // Active vs inactive members
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'ACTIVE')::int as active,
          COUNT(*) FILTER (WHERE status = 'INACTIVE')::int as inactive
        FROM users WHERE role = 'MEMBER'
      `),

      // Batch distribution
      pool.query(`
        SELECT batch, COUNT(*)::int as count
        FROM memberships
        GROUP BY batch
        ORDER BY batch
      `),

      // Fee status breakdown
      pool.query(`
        SELECT fee_status, COUNT(*)::int as count
        FROM memberships
        GROUP BY fee_status
      `),

      // ── PAYMENT ANALYTICS ──
      // Payment method breakdown
      pool.query(`
        SELECT payment_method, COUNT(*)::int as count, SUM(amount_etb)::numeric as total
        FROM payments
        WHERE status = 'COMPLETED'
          AND created_at >= $1 AND created_at <= $2
        GROUP BY payment_method
        ORDER BY total DESC
      `, [dateFrom, dateTo]),

      // Monthly revenue (last 12 months)
      pool.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', paid_at), 'Mon YYYY') as month,
          DATE_TRUNC('month', paid_at) as month_date,
          SUM(amount_etb)::numeric as total,
          COUNT(*)::int as transactions
        FROM payments
        WHERE status = 'COMPLETED'
          AND paid_at >= $1 AND paid_at <= $2
        GROUP BY DATE_TRUNC('month', paid_at)
        ORDER BY month_date ASC
      `, [dateFrom, dateTo]),

      // Revenue by plan
      pool.query(`
        SELECT p.name as plan_name, SUM(pay.amount_etb)::numeric as total
        FROM payments pay
        JOIN memberships m ON m.id = pay.membership_id
        JOIN plans p ON p.id = m.plan_id
        WHERE pay.status = 'COMPLETED'
          AND pay.created_at >= $1 AND pay.created_at <= $2
        GROUP BY p.name
        ORDER BY total DESC
      `, [dateFrom, dateTo]),

      // ── ATTENDANCE ──
      // Daily traffic (last 30 days)
      pool.query(`
        SELECT
          TO_CHAR(booked_at, 'Mon DD') as day_label,
          booked_at::date as day_date,
          COUNT(*)::int as bookings,
          COUNT(*) FILTER (WHERE attended = true)::int as attended
        FROM bookings
        WHERE booked_at >= NOW() - INTERVAL '30 days'
          AND cancelled = false
        GROUP BY booked_at::date, TO_CHAR(booked_at, 'Mon DD')
        ORDER BY day_date ASC
      `),

      // Peak hours
      pool.query(`
        SELECT
          EXTRACT(HOUR FROM booked_at)::int as hour,
          COUNT(*)::int as count
        FROM bookings
        WHERE cancelled = false
        GROUP BY EXTRACT(HOUR FROM booked_at)
        ORDER BY hour
      `),

      // Weekly traffic (day of week)
      pool.query(`
        SELECT
          TO_CHAR(booked_at, 'Dy') as day_name,
          EXTRACT(DOW FROM booked_at)::int as day_num,
          COUNT(*)::int as count
        FROM bookings
        WHERE cancelled = false
        GROUP BY TO_CHAR(booked_at, 'Dy'), EXTRACT(DOW FROM booked_at)
        ORDER BY day_num
      `),

      // ── GROWTH ──
      // New sign-ups over time (monthly)
      pool.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
          DATE_TRUNC('month', created_at) as month_date,
          COUNT(*)::int as signups
        FROM users
        WHERE role = 'MEMBER'
          AND created_at >= $1 AND created_at <= $2
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month_date ASC
      `, [dateFrom, dateTo]),

      // Churn rate (members who became inactive in date range)
      pool.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', updated_at), 'Mon YYYY') as month,
          DATE_TRUNC('month', updated_at) as month_date,
          COUNT(*)::int as churned
        FROM users
        WHERE role = 'MEMBER' AND status = 'INACTIVE'
          AND updated_at >= $1 AND updated_at <= $2
        GROUP BY DATE_TRUNC('month', updated_at)
        ORDER BY month_date ASC
      `, [dateFrom, dateTo]),

      // ── KPIs ──
      pool.query("SELECT COUNT(*)::int as count FROM users WHERE role = 'MEMBER'"),
      pool.query("SELECT COUNT(*)::int as count FROM users WHERE role = 'MEMBER' AND status = 'ACTIVE'"),
      pool.query(`
        SELECT COALESCE(SUM(amount_etb), 0)::numeric as total
        FROM payments
        WHERE status = 'COMPLETED'
          AND paid_at >= DATE_TRUNC('month', NOW())
      `),
      pool.query("SELECT COUNT(*)::int as count FROM memberships WHERE fee_status = 'OVERDUE'"),
      pool.query(`
        SELECT COUNT(*)::int as count FROM memberships
        WHERE end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
      `),
    ]);

    // Format peak hours for display
    const peakHours = hourlyTrafficRes.rows.map((r) => ({
      hour: `${r.hour}:00`,
      count: r.count,
    }));

    // Build response
    const activeInactive = activeInactiveRes.rows[0] || { active: 0, inactive: 0 };

    res.json({
      success: true,
      data: {
        kpis: {
          totalMembers: totalMembersRes.rows[0].count,
          activeMembers: activeMembersRes.rows[0].count,
          monthlyRevenue: Number(totalRevenueRes.rows[0].total),
          overduePayments: overdueCountRes.rows[0].count,
          expiringThisWeek: expiringRes.rows[0].count,
        },
        demographics: {
          genderDistribution: genderRes.rows,
          ageGroups: ageGroupRes.rows,
        },
        memberships: {
          planPopularity: planPopularityRes.rows,
          activeVsInactive: activeInactive,
          batchDistribution: batchDistRes.rows,
          feeStatus: feeStatusRes.rows,
        },
        payments: {
          methodBreakdown: methodBreakdownRes.rows,
          monthlyRevenue: monthlyRevenueRes.rows.map((r) => ({
            month: r.month,
            total: Number(r.total),
            transactions: r.transactions,
          })),
          revenueByPlan: revenueByPlanRes.rows.map((r) => ({
            plan_name: r.plan_name,
            total: Number(r.total),
          })),
        },
        attendance: {
          dailyTraffic: dailyTrafficRes.rows,
          peakHours,
          weeklyTraffic: weeklyTrafficRes.rows,
        },
        growth: {
          signups: signupsOverTimeRes.rows,
          churn: churnRes.rows,
        },
      },
    });
  } catch (err) {
    console.error("Insights Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { getInsights };
