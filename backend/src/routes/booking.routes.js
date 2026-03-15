const { Router } = require("express");
const { getClasses, createClass, bookClass, getClassById, updateClass, updateBooking } = require("../controllers/booking.controller");
const { authenticate, requireAdminOrStaff } = require("../middleware/auth.middleware");

const router = Router();

router.use(authenticate);

// Class Routes
router.get("/", getClasses);
router.post("/", requireAdminOrStaff, createClass);
router.get("/:id", getClassById); 
router.patch("/:id", requireAdminOrStaff, updateClass); 

// Booking Routes
router.post("/book", bookClass);
router.patch("/:id/booking/:bookingId", updateBooking);

module.exports = router;