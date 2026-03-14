const { Router } = require("express");
const { getClasses, createClass, bookClass } = require("../controllers/booking.controller");
const { authenticate, requireAdminOrStaff } = require("../middleware/auth.middleware");
const router = Router();
router.use(authenticate);
router.get("/", getClasses);
router.post("/", requireAdminOrStaff, createClass);
router.post("/book", bookClass);
module.exports = router;