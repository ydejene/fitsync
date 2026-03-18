const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

// POST /api/auth/google
async function googleLogin(req, res) {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: "ID token is required" });
    }

    // Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

        // Check if user exists
    let { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    let user = rows[0];

    if (!user) {
      // Create user if they don't exist
      const randomPassword = require("crypto").randomBytes(16).toString("hex");
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      const insertResult = await pool.query(
        "INSERT INTO users (full_name, email, password_hash, role, status) VALUES ($1, $2, $3, 'ADMIN', 'ACTIVE') RETURNING *",
        [name, email, passwordHash]
      );
      user = insertResult.rows[0];

      // Initial audit log for registration
      await pool.query(
        "INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)",
        [user.id, user.email, "REGISTER_GOOGLE", "user", user.id]
      );
    } else {
      if (user.status === "INACTIVE") {
        return res.status(401).json({ success: false, message: "Account is deactivated" });
      }
      
      // FOR TESTING: Upgrade existing MEMBER to ADMIN
      if (user.role === "MEMBER") {
        const updateResult = await pool.query(
          "UPDATE users SET role = 'ADMIN' WHERE id = $1 RETURNING *",
          [user.id]
        );
        user = updateResult.rows[0];
        console.log(`Upgraded existing user ${user.email} to ADMIN`);
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Set cookie
    res.cookie("fitsync_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Audit log for login
    await pool.query(
      "INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)",
      [user.id, user.email, "LOGIN_GOOGLE", "user", user.id]
    );

    res.json({
      success: true,
      message: "Google login successful",
      data: { user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role } },
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(401).json({ success: false, message: "Invalid Google token" });
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
      "SELECT id, full_name, email, role, status FROM users WHERE id = $1",
      [req.user.id]
    );
    const user = rows[0];
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    res.json({
      success: true,
      data: { user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role } },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { login, googleLogin, logout, me };