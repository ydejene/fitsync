require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes       = require("./routes/auth.routes");
const memberRoutes     = require("./routes/member.routes");
const paymentRoutes    = require("./routes/payment.routes");
const membershipRoutes = require("./routes/membership.routes");
const bookingRoutes    = require("./routes/booking.routes");
const dashboardRoutes  = require("./routes/dashboard.routes");
const staffRoutes      = require("./routes/staff.routes");
const analyticsRoutes  = require("./routes/analytics.routes");
const auditRoutes      = require("./routes/audit.routes");
const insightsRoutes   = require("./routes/insights.routes");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ── Routes ──
app.get("/", (_req, res) => {
  res.send("Welcome to FitSync API.");
});
app.use("/api/auth",        authRoutes);
app.use("/api/members",     memberRoutes);
app.use("/api/payments",    paymentRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/bookings",    bookingRoutes);
app.use("/api/dashboard",   dashboardRoutes);
app.use("/api/staff",       staffRoutes);
app.use("/api/analytics",   analyticsRoutes);
app.use("/api/audit",       auditRoutes);
app.use("/api/insights",    insightsRoutes);

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