const { Router } = require("express");
const { getInsights } = require("../controllers/insights.controller");
const { authenticate, requireAdminOrStaff } = require("../middleware/auth.middleware");

const router = Router();
router.get("/", authenticate, requireAdminOrStaff, getInsights);

module.exports = router;
