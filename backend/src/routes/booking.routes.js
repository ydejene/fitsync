const { Router } = require("express");
//update the line below👇
const { getClasses, createClass, bookClass, getClassById, updateClass, updateBooking } = require("../controllers/booking.controller");
const { authenticate, requireAdminOrStaff } = require("../middleware/auth.middleware");

const router = Router();

router.use(authenticate);

// Class Routes
router.get("/", getClasses);
router.post("/", requireAdminOrStaff, createClass);
router.get("/:id", getClassById); // <--- New to be added
router.patch("/:id", requireAdminOrStaff, updateClass); // <--- New to be added

// Booking Routes
router.post("/book", bookClass);
router.patch("/:id/booking/:bookingId", updateBooking); // <--- New to be added

module.exports = router;