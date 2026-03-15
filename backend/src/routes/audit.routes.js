const { Router } = require("express");
const { getAuditLogs } = require("../controllers/audit.controller");
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");
const router = Router();
router.get("/", authenticate, requireAdmin, getAuditLogs);
module.exports = router;