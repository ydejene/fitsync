process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Bypass strict SSL for Telebirr sandbox
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes           = require("./routes/auth.routes");
const memberRoutes         = require("./routes/member.routes");
const paymentRoutes        = require("./routes/payment.routes");
const membershipRoutes     = require("./routes/membership.routes");
const bookingRoutes        = require("./routes/booking.routes");
const dashboardRoutes      = require("./routes/dashboard.routes");
const staffRoutes          = require("./routes/staff.routes");
const analyticsRoutes      = require("./routes/analytics.routes");
const auditRoutes          = require("./routes/audit.routes");
const insightsRoutes   = require("./routes/insights.routes");
const userRoutes       = require("./routes/user.routes");
const telebirrRoutes       = require("./routes/telebirr.routes");
const subscriptionRoutes   = require("./routes/subscription.routes");
const { requireActiveSubscription } = require("./middleware/subscription.middleware");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://192.168.1.2:3000"
  ],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ── Security Headers for Google Auth ──
app.use((_req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// ── Static Files ──
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── Public Routes (no subscription check) ──
app.use("/api/auth",               authRoutes);
app.use("/api/telebirr",           telebirrRoutes);
app.use("/api/subscription-plans", subscriptionRoutes);

// ── Protected Routes (require active subscription for OWNER users) ──
app.use("/api/members",     requireActiveSubscription, memberRoutes);
app.use("/api/payments",    requireActiveSubscription, paymentRoutes);
app.use("/api/memberships", requireActiveSubscription, membershipRoutes);
app.use("/api/bookings",    requireActiveSubscription, bookingRoutes);
app.use("/api/dashboard",   requireActiveSubscription, dashboardRoutes);
app.use("/api/staff",       requireActiveSubscription, staffRoutes);
app.use("/api/analytics",   requireActiveSubscription, analyticsRoutes);
app.use("/api/audit",       requireActiveSubscription, auditRoutes);
app.use("/api/insights",    insightsRoutes);
app.use("/api/users",       userRoutes);

// ── Health check ──
app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "FitSync API is running", port: PORT });
});

// ── Global error handler ──
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`FitSync backend running on http://localhost:${PORT}`);
});