const { Router } = require("express");
const { getPayments, createPayment } = require("../controllers/payment.controller");
const { authenticate, requireAdminOrStaff } = require("../middleware/auth.middleware");
const router = Router();
router.use(authenticate, requireAdminOrStaff);
router.get("/", getPayments);
router.post("/", createPayment);
module.exports = router;