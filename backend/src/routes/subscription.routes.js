/**
 * @fileoverview Subscription Plan Routes
 * Public endpoints for fetching available B2B subscription plans.
 * These are accessible without authentication so the pricing page
 * can display plans to prospective gym owners.
 *
 * Routes:
 *  GET /api/subscription-plans      – List all active plans
 *  GET /api/subscription-plans/:id  – Get a specific plan
 *
 * @module routes/subscription
 */

const { Router } = require("express");
const pool = require("../config/db");

const router = Router();

/**
 * GET /api/subscription-plans
 * Returns all active subscription plans, ordered by price ascending.
 * Public endpoint — no authentication required.
 */
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, description, price_etb, billing_cycle,
              duration_days, features
       FROM subscription_plans
       WHERE is_active = true
       ORDER BY price_etb ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Fetch subscription plans error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * GET /api/subscription-plans/:id
 * Returns a single subscription plan by ID.
 * Public endpoint — no authentication required.
 */
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, description, price_etb, billing_cycle,
              duration_days, features
       FROM subscription_plans
       WHERE id = $1 AND is_active = true`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("Fetch subscription plan error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
