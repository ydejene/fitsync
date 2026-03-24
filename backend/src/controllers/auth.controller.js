const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * POST /api/auth/register
 * Creates a new gym owner account with pending subscription status.
 * The owner must complete payment before accessing dashboard features.
 */
async function register(req, res) {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, and password are required",
      });
    }

    // Check if email already exists
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with OWNER role and pending subscription
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role, status, subscription_status)
       VALUES ($1, $2, $3, $4, 'OWNER', 'ACTIVE', 'pending')
       RETURNING id, full_name, email, role, subscription_status`,
      [fullName, email, passwordHash, phone || null]
    );
    const user = rows[0];

    // Issue JWT token so user is immediately logged in
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie("fitsync_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Audit log: registration
    await pool.query(
      "INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id) VALUES ($1,$2,$3,$4,$5)",
      [user.id, user.email, "REGISTER", "user", user.id]
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
          subscriptionStatus: user.subscription_status,
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password required" });

    const { rows } = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    const user = rows[0];
    if (!user)
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    if (user.status === "INACTIVE")
      return res.status(401).json({ success: false, message: "Account is deactivated" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie("fitsync_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Audit log
    await pool.query(
      "INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id) VALUES ($1,$2,$3,$4,$5)",
      [user.id, user.email, "LOGIN", "user", user.id]
    );

    res.json({
      success: true,
      message: "Login successful",
      data: { user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role } },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// POST /api/auth/logout
function logout(_req, res) {
  res.clearCookie("fitsync_token");
  res.json({ success: true, message: "Logged out successfully" });
}

// GET /api/auth/me
async function me(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, full_name, email, role, status,
              subscription_status, subscription_end
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    const user = rows[0];
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
          subscriptionStatus: user.subscription_status,
          subscriptionEnd: user.subscription_end,
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { register, login, logout, me };