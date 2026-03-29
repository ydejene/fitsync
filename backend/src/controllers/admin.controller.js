const pool = require("../config/db");

/**
 * GET /api/admin/stats
 * Platform-level overview: total gyms, revenue from subscriptions, etc.
 */
async function getPlatformStats(_req, res) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      { rows: [{ count: totalGyms }] },
      { rows: [{ count: activeGyms }] },
      { rows: [{ count: pendingGyms }] },
      { rows: [{ count: inactiveGyms }] },
      { rows: [{ total: revenueThisMonth }] },
      { rows: [{ total: revenueLastMonth }] },
      { rows: [{ total: revenueAllTime }] },
      { rows: recentGyms },
    ] = await Promise.all([
      // Total gym owners (OWNER role)
      pool.query("SELECT COUNT(*) FROM users WHERE role='OWNER'"),
      // Active subscribers
      pool.query("SELECT COUNT(*) FROM users WHERE role='OWNER' AND subscription_status='active'"),
      // Pending (signed up but not subscribed)
      pool.query("SELECT COUNT(*) FROM users WHERE role='OWNER' AND subscription_status='pending'"),
      // Inactive users (deactivated by admin)
      pool.query("SELECT COUNT(*) FROM users WHERE role='OWNER' AND status='INACTIVE'"),
      // Revenue this month from telebirr subscription payments
      pool.query(
        `SELECT COALESCE(SUM(tt.total_amount), 0) AS total
         FROM telebirr_transactions tt
         WHERE tt.status='success'
           AND tt.subscription_plan_id IS NOT NULL
           AND tt.created_at >= $1`,
        [startOfMonth]
      ),
      // Revenue last month
      pool.query(
        `SELECT COALESCE(SUM(tt.total_amount), 0) AS total
         FROM telebirr_transactions tt
         WHERE tt.status='success'
           AND tt.subscription_plan_id IS NOT NULL
           AND tt.created_at >= $1 AND tt.created_at <= $2`,
        [startOfLastMonth, endOfLastMonth]
      ),
      // All-time platform revenue
      pool.query(
        `SELECT COALESCE(SUM(tt.total_amount), 0) AS total
         FROM telebirr_transactions tt
         WHERE tt.status='success' AND tt.subscription_plan_id IS NOT NULL`
      ),
      // Most recent 8 gym owners
      pool.query(
        `SELECT u.id, u.full_name, u.email, u.phone, u.status,
                u.subscription_status, u.subscription_end, u.created_at,
                sp.name AS plan_name, sp.price_etb AS plan_price
         FROM users u
         LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
         WHERE u.role = 'OWNER'
         ORDER BY u.created_at DESC
         LIMIT 8`
      ),
    ]);

    const revThisMonth = parseFloat(revenueThisMonth);
    const revLastMonth = parseFloat(revenueLastMonth);
    const revChange = revLastMonth > 0
      ? parseFloat((((revThisMonth - revLastMonth) / revLastMonth) * 100).toFixed(1))
      : 0;

    res.json({
      success: true,
      data: {
        totalGyms: parseInt(totalGyms),
        activeGyms: parseInt(activeGyms),
        pendingGyms: parseInt(pendingGyms),
        inactiveGyms: parseInt(inactiveGyms),
        revenueThisMonth: revThisMonth,
        revenueLastMonth: revLastMonth,
        revenueAllTime: parseFloat(revenueAllTime),
        revenueChange: revChange,
        recentGyms: recentGyms.map((g) => ({
          id: g.id,
          fullName: g.full_name,
          email: g.email,
          phone: g.phone,
          status: g.status,
          subscriptionStatus: g.subscription_status,
          subscriptionEnd: g.subscription_end,
          planName: g.plan_name,
          planPrice: g.plan_price ? parseFloat(g.plan_price) : null,
          createdAt: g.created_at,
        })),
      },
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * GET /api/admin/gyms
 * Paginated list of all gym owners with their subscription details
 */
async function listGyms(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, parseInt(req.query.pageSize) || 20);
    const offset = (page - 1) * pageSize;
    const search = req.query.search?.trim() || "";
    const status = req.query.status || ""; // ACTIVE | INACTIVE
    const subStatus = req.query.subStatus || ""; // active | pending | expired | cancelled

    const conditions = ["u.role = 'OWNER'"];
    const params = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`(u.full_name ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (status) {
      conditions.push(`u.status = $${paramIdx}`);
      params.push(status.toUpperCase());
      paramIdx++;
    }
    if (subStatus) {
      conditions.push(`u.subscription_status = $${paramIdx}`);
      params.push(subStatus.toLowerCase());
      paramIdx++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [{ rows: countRows }, { rows }] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM users u ${whereClause}`,
        params
      ),
      pool.query(
        `SELECT u.id, u.full_name, u.email, u.phone, u.status,
                u.subscription_status, u.subscription_start, u.subscription_end,
                u.created_at,
                sp.name AS plan_name, sp.price_etb AS plan_price, sp.billing_cycle
         FROM users u
         LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
         ${whereClause}
         ORDER BY u.created_at DESC
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...params, pageSize, offset]
      ),
    ]);

    const total = parseInt(countRows[0].count);

    res.json({
      success: true,
      data: {
        gyms: rows.map((g) => ({
          id: g.id,
          fullName: g.full_name,
          email: g.email,
          phone: g.phone,
          status: g.status,
          subscriptionStatus: g.subscription_status,
          subscriptionStart: g.subscription_start,
          subscriptionEnd: g.subscription_end,
          planName: g.plan_name,
          planPrice: g.plan_price ? parseFloat(g.plan_price) : null,
          billingCycle: g.billing_cycle,
          createdAt: g.created_at,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error("Admin listGyms error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * PATCH /api/admin/gyms/:id/status
 * Activate or deactivate a gym owner account
 */
async function setGymStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({ success: false, message: "status must be ACTIVE or INACTIVE" });
    }

    const { rows } = await pool.query(
      `UPDATE users SET status = $1, updated_at = NOW()
       WHERE id = $2 AND role = 'OWNER'
       RETURNING id, full_name, email, status`,
      [status, id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Gym owner not found" });
    }

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id, new_value)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user.id,
        req.user.email,
        status === "INACTIVE" ? "DEACTIVATE_GYM" : "ACTIVATE_GYM",
        "user",
        id,
        JSON.stringify({ status }),
      ]
    );

    res.json({
      success: true,
      message: `Gym ${status === "INACTIVE" ? "deactivated" : "activated"} successfully`,
      data: { gym: rows[0] },
    });
  } catch (err) {
    console.error("Admin setGymStatus error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * GET /api/admin/revenue-chart
 * Monthly revenue from subscriptions for the past 12 months
 */
async function getRevenueChart(_req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month_label,
        DATE_TRUNC('month', created_at) AS month_start,
        COALESCE(SUM(total_amount), 0) AS revenue
      FROM telebirr_transactions
      WHERE status = 'success'
        AND subscription_plan_id IS NOT NULL
        AND created_at >= NOW() - INTERVAL '11 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month_start ASC
    `);

    // Ensure we always return 12 months, filling zeros where data is missing
    const chart = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      
      // Look for data in DB rows
      const dbRow = rows.find(r => r.month_label === label);
      chart.push({
        month: label,
        revenue: dbRow ? parseFloat(dbRow.revenue) : 0
      });
    }

    res.json({
      success: true,
      data: { chart },
    });
  } catch (err) {
    console.error("Admin revenueChart error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { getPlatformStats, listGyms, setGymStatus, getRevenueChart };
