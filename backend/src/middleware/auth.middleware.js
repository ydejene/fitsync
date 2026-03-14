const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  try {
    const token =
      req.cookies?.fitsync_token ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized – please log in" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
}

function requireAdminOrStaff(req, res, next) {
  if (!["ADMIN", "STAFF"].includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: "Staff access required" });
  }
  next();
}

module.exports = { authenticate, requireAdmin, requireAdminOrStaff };