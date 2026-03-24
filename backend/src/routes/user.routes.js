const { Router } = require("express");
const { updateProfile, uploadProfilePhoto } = require("../controllers/user.controller");
const { authenticate } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

const router = Router();

router.put("/profile", authenticate, updateProfile);
router.post("/profile/photo", authenticate, upload.single("photo"), uploadProfilePhoto);

module.exports = router;
