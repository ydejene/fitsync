const { Router } = require("express");
const { getMemberships, createMembership, getPlans } = require("../controllers/membership.controller");
const { authenticate, requireAdminOrStaff } = require("../middleware/auth.middleware");
const router = Router();
router.use(authenticate, requireAdminOrStaff);
router.get("/plans", getPlans);
router.get("/", getMemberships);
router.post("/", createMembership);
module.exports = router;