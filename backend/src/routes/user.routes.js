const { Router } = require("express");
const { updateProfile } = require("../controllers/user.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = Router();

router.put("/profile", authenticate, updateProfile);

module.exports = router;
