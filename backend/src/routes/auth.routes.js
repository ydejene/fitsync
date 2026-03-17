const { Router } = require("express");
const { login, googleLogin, logout, me } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const router = Router();
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/logout", logout);
router.get("/me", authenticate, me);
module.exports = router;