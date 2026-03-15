const { Router } = require("express");
const { getDashboardStats } = require("../controllers/dashboard.controller");
const { authenticate, requireAdminOrStaff } = require("../middleware/auth.middleware");
const router = Router();
router.get("/", authenticate, requireAdminOrStaff, getDashboardStats);
module.exports = router;