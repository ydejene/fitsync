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

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("FitSync API running");
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});