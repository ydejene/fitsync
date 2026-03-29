const { Router } = require("express");
const { getDashboardStats, getMemberDashboard } = require("../controllers/dashboard.controller");
const { authenticate, requireAdminOrStaff } = require("../middleware/auth.middleware");
const router = Router();
router.get("/", authenticate, requireAdminOrStaff, getDashboardStats);
router.get("/member", authenticate, getMemberDashboard);
module.exports = router;