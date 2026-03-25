const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function getStaffPermissionsForUser(userId) {
  const pResult = await pool.query(
    "SELECT new_value FROM audit_logs WHERE entity_type='staff_permissions' AND entity_id=$1 ORDER BY created_at DESC LIMIT 1",
    [userId]
  );
  const defaults = { 
    canManageMembers: false, 
    canManagePayments: false, 
    canManageBookings: false, 
    canViewReports: false, 
    canManagePlans: false 
  };
  if (!pResult.rows[0]) return defaults;
  
  const raw = pResult.rows[0].new_value;
  return {
    canManageMembers: raw.canManageMembers ?? raw.manageMembers ?? false,
    canManagePayments: raw.canManagePayments ?? raw.managePayments ?? false,
    canManageBookings: raw.canManageBookings ?? raw.manageBookings ?? false,
    canViewReports: raw.canViewReports ?? raw.viewReports ?? false,
    canManagePlans: raw.canManagePlans ?? raw.managePlans ?? false,
  };
}

/**
 * Helper to format user object for responses
 */
function formatUserResponse(user, permissions) {
  const result = {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    profilePhotoUrl: user.profile_photo_url,
    phone: user.phone,
    address: user.address,
    dob: user.dob,
    gender: user.gender,
    whatsappNumber: user.whatsapp_number,
    emergencyContact: user.emergency_contact,
    subscriptionStatus: user.subscription_status,
    subscriptionEnd: user.subscription_end,
  };
  if (permissions !== undefined) {
    result.permissions = permissions;
  }
  return result;
}

// Common SELECT fields for user
const USER_FIELDS = `
  id, full_name, email, password_hash, role, status, 
  profile_photo_url, phone, address, dob, gender, 
  whatsapp_number, emergency_contact, 
  subscription_status, subscription_end
`;

/**
 * POST /api/auth/register
 * Creates a new gym owner account with pending subscription status.
 */
async function register(req, res) {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, password, and phone are required",
      });
    }

    // Email Regex Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
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
       RETURNING ${USER_FIELDS}`,
      [fullName, email, passwordHash, phone]
    );
    const user = rows[0];

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

    await pool.query(
      "INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id) VALUES ($1,$2,$3,$4,$5)",
      [user.id, user.email, "REGISTER", "user", user.id]
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: { user: formatUserResponse(user) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password required" });

    // Email Regex Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    const { rows } = await pool.query(
      `SELECT ${USER_FIELDS} FROM users WHERE email = $1`,
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

    let permissions = undefined;
    if (user.role === 'STAFF') {
      permissions = await getStaffPermissionsForUser(user.id);
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        fullName: user.full_name,
        profilePhotoUrl: user.profile_photo_url,
        permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie("fitsync_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    await pool.query(
      "INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id) VALUES ($1,$2,$3,$4,$5)",
      [user.id, user.email, "LOGIN", "user", user.id]
    );

    res.json({
      success: true,
      message: "Login successful",
      data: { user: formatUserResponse(user, permissions) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * POST /api/auth/google
 * Automatically registers new users as OWNER with pending subscription.
 */
async function googleLogin(req, res) {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: "ID token is required" });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture: profilePhotoUrl } = payload;

    let { rows } = await pool.query(`SELECT ${USER_FIELDS} FROM users WHERE email = $1`, [email]);
    let user = rows[0];

    if (!user) {
      // REGISTER via Google: Always OWNER + pending subscription
      const randomPassword = require("crypto").randomBytes(16).toString("hex");
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      const insertResult = await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role, status, profile_photo_url, subscription_status) 
         VALUES ($1, $2, $3, 'OWNER', 'ACTIVE', $4, 'pending') 
         RETURNING ${USER_FIELDS}`,
        [name, email, passwordHash, profilePhotoUrl]
      );
      user = insertResult.rows[0];

      await pool.query(
        "INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)",
        [user.id, user.email, "REGISTER_GOOGLE", "user", user.id]
      );
    } else {
      if (user.status === "INACTIVE") {
        return res.status(401).json({ success: false, message: "Account is deactivated" });
      }
      
      // Update profile photo if missing
      if (profilePhotoUrl && user.profile_photo_url !== profilePhotoUrl) {
        const updateResult = await pool.query(
          "UPDATE users SET profile_photo_url = $1 WHERE id = $2 RETURNING *",
          [profilePhotoUrl, user.id]
        );
        user = { ...user, ...updateResult.rows[0] };
      }
    }

    let permissions = undefined;
    if (user.role === 'STAFF') {
      permissions = await getStaffPermissionsForUser(user.id);
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        fullName: user.full_name,
        profilePhotoUrl: user.profile_photo_url,
        permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie("fitsync_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    await pool.query(
      "INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)",
      [user.id, user.email, "LOGIN_GOOGLE", "user", user.id]
    );

    res.json({
      success: true,
      message: "Google login successful",
      data: { user: formatUserResponse(user, permissions) },
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(401).json({ success: false, message: "Invalid Google token" });
  }
}

/**
 * POST /api/auth/logout
 */
function logout(_req, res) {
  res.clearCookie("fitsync_token");
  res.json({ success: true, message: "Logged out successfully" });
}

/**
 * GET /api/auth/me
 */
async function me(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT ${USER_FIELDS} FROM users WHERE id = $1`,
      [req.user.id]
    );
    const user = rows[0];
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    let permissions = undefined;
    if (user.role === 'STAFF') {
      permissions = await getStaffPermissionsForUser(user.id);
    }

    res.json({
      success: true,
      data: { user: formatUserResponse(user, permissions) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { register, login, googleLogin, logout, me };
