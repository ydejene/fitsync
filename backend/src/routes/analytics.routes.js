const { Router } = require("express");
const { getAnalytics } = require("../controllers/analytics.controller");
const { authenticate, requireAdminOrStaff } = require("../middleware/auth.middleware");

const router = Router();
router.get("/", authenticate, requireAdminOrStaff, getAnalytics);

module.exports = router;