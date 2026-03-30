const express = require("express");
const router = express.Router();
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");
const {
  getPlatformStats,
  listGyms,
  setGymStatus,
  getRevenueChart,
} = require("../controllers/admin.controller");

// All admin routes require authentication AND admin role
router.use(authenticate, requireAdmin);

// GET  /api/admin/stats          – Platform KPIs
router.get("/stats", getPlatformStats);

// GET  /api/admin/gyms           – Paginated gym list
router.get("/gyms", listGyms);

// PATCH /api/admin/gyms/:id/status – Activate / deactivate a gym
router.patch("/gyms/:id/status", setGymStatus);

// GET  /api/admin/revenue-chart  – Monthly subscription revenue chart
router.get("/revenue-chart", getRevenueChart);

module.exports = router;
