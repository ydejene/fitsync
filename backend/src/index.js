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
const { authenticate } = require("./middleware/auth.middleware");
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

// ── Public Routes (no authentication required) ──
app.use("/api/auth",               authRoutes);
app.use("/api/telebirr",           telebirrRoutes);
app.use("/api/subscription-plans", subscriptionRoutes);

// ── Protected Routes (AUTHENTICATION REQUIRED) ──
app.use(authenticate); // Following routes require a valid token

// 1. Account info (no subscription needed to see profile/pay)
app.use("/api/users", userRoutes);

// 2. Gym Management features (SUBSCRIPTION REQUIRED for Owners)
const sub_check = requireActiveSubscription;

app.use("/api/dashboard",   sub_check, dashboardRoutes);
app.use("/api/members",     sub_check, memberRoutes);
app.use("/api/payments",    sub_check, paymentRoutes);
app.use("/api/memberships", sub_check, membershipRoutes);
app.use("/api/bookings",    sub_check, bookingRoutes);
app.use("/api/staff",       sub_check, staffRoutes);
app.use("/api/analytics",   sub_check, analyticsRoutes);
app.use("/api/audit",       sub_check, auditRoutes);
app.use("/api/insights",    insightsRoutes); // Analytics insights


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