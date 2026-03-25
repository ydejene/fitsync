/**
 * @fileoverview Subscription Enforcement Middleware
 * Ensures only gym owners with active subscriptions can access
 * dashboard features. Returns 403 if subscription is not active.
 *
 * Applied to: members, memberships, payments, bookings, classes,
 *             dashboard, analytics, staff routes.
 * NOT applied to: auth, telebirr, subscription-plans routes.
 *
 * @module middleware/subscription
 */

const pool = require("../config/db");

/**
 * Middleware: Requires an active subscription for OWNER users.
 * ADMIN and STAFF users bypass this check (they manage the platform).
 * MEMBER users also bypass (they're gym members, not subscribers).
 *
 * Checks:
 * 1. User role is 'OWNER'
 * 2. subscription_status === 'active'
 * 3. subscription_end >= current date
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function requireActiveSubscription(req, res, next) {
  try {
    // Safety check: If no user is present, we cannot check subscription
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    // Only enforce for OWNER role — ADMIN/STAFF/MEMBER bypass
    if (req.user.role !== "OWNER") {
      return next();
    }

    const { rows } = await pool.query(
      `SELECT subscription_status, subscription_end
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const isActive = user.subscription_status === "active";
    const isNotExpired = user.subscription_end && new Date(user.subscription_end) >= new Date();

    if (!isActive || !isNotExpired) {
      return res.status(403).json({
        success: false,
        message: "Active subscription required. Please subscribe to access this feature.",
        code: "SUBSCRIPTION_REQUIRED",
      });
    }

    next();
  } catch (err) {
    console.error("Subscription middleware error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { requireActiveSubscription };
