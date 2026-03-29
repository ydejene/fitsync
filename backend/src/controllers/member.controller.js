const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const {
  isValidEmail,
  isValidGender,
  normalizeOptionalString,
  normalizeRequiredString,
} = require("../utils/validation");

// GET /api/members
async function getMembers(req, res) {
  try {
    const { q: search = "", status = "", page = "1", limit = "20" } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = ["u.role = 'MEMBER'"];

    if (status && status !== "ALL") {
      params.push(status);
      conditions.push(`u.status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      const n = params.length;
      conditions.push(`(u.full_name ILIKE $${n} OR u.email ILIKE $${n} OR u.phone ILIKE $${n})`);
    }

    const where = conditions.join(" AND ");
    params.push(parseInt(limit), offset);
    const limitIdx  = params.length - 1;
    const offsetIdx = params.length;

    const { rows: members } = await pool.query(`
      SELECT u.id, u.full_name, u.email, u.phone, u.gender, u.status, u.created_at,
             p.name AS plan_name, m.end_date, m.fee_status
      FROM users u
      LEFT JOIN memberships m ON m.user_id = u.id
        AND m.id = (SELECT id FROM memberships WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1)
      LEFT JOIN plans p ON p.id = m.plan_id
      WHERE ${where}
      ORDER BY u.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `, params);

    // total count
    const countParams = params.slice(0, params.length - 2);
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM users u WHERE ${where}`, countParams
    );
    const total = parseInt(countRows[0].count);

    res.json({ success: true, data: { members, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// GET /api/members/:id
async function getMemberById(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT id, full_name, email, phone, address, gender, status, dob, whatsapp_number, emergency_contact, profile_photo_url, created_at FROM users WHERE id = $1 AND role = 'MEMBER'",
      [req.params.id]
    );
    if (!rows[0])
      return res.status(404).json({ success: false, message: "Member not found" });

    const { rows: memberships } = await pool.query(
      `SELECT m.*, p.name AS plan_name, p.price_etb FROM memberships m
       JOIN plans p ON p.id = m.plan_id WHERE m.user_id = $1 ORDER BY m.created_at DESC`,
      [req.params.id]
    );
    const { rows: payments } = await pool.query(
      "SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10",
      [req.params.id]
    );

    res.json({ success: true, data: { member: { ...rows[0], memberships, payments } } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// POST /api/members
async function createMember(req, res) {
  try {
    const fullName = normalizeRequiredString(req.body.fullName);
    const email = normalizeRequiredString(req.body.email);
    const password = normalizeRequiredString(req.body.password);
    const gender = normalizeRequiredString(req.body.gender);
    const phone = normalizeOptionalString(req.body.phone);
    const dateOfBirth = normalizeOptionalString(req.body.dateOfBirth);
    const address = normalizeOptionalString(req.body.address);
    const whatsappNumber = normalizeOptionalString(req.body.whatsappNumber);
    const emergencyContact = normalizeOptionalString(req.body.emergencyContact);

    if (!fullName) {
      return res.status(400).json({ success: false, message: "Full name is required." });
    }
    if (!email) {
      return res.status(400).json({ success: false, message: "Email address is required." });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required." });
    }
    if (!gender) {
      return res.status(400).json({ success: false, message: "Gender is required." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }
    if (!isValidGender(gender)) {
      return res.status(400).json({ success: false, message: "Gender must be MALE, FEMALE, or OTHER." });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows[0])
      return res.status(400).json({ success: false, message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, phone, address, dob, gender, whatsapp_number, emergency_contact, role, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'MEMBER','ACTIVE')
       RETURNING id, full_name, email, phone, address, dob, gender, whatsapp_number, emergency_contact, status, created_at`,
      [fullName, email, passwordHash, phone, address, dateOfBirth, gender, whatsappNumber, emergencyContact]
    );

    await pool.query(
      "INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id) VALUES ($1,$2,$3,$4,$5)",
      [req.user.id, req.user.email, "MEMBER_CREATED", "user", rows[0].id]
    );

    res.status(201).json({ success: true, data: { member: rows[0] }, message: "Member created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// PATCH /api/members/:id
async function updateMember(req, res) {
  try {
    const fullName = normalizeRequiredString(req.body.fullName);
    const phone = normalizeOptionalString(req.body.phone);
    const address = normalizeOptionalString(req.body.address);
    const gender = normalizeRequiredString(req.body.gender);
    const status = normalizeRequiredString(req.body.status);
    const dateOfBirth = normalizeOptionalString(req.body.dateOfBirth);
    const whatsappNumber = normalizeOptionalString(req.body.whatsappNumber);
    const emergencyContact = normalizeOptionalString(req.body.emergencyContact);

    if (!fullName) {
      return res.status(400).json({ success: false, message: "Full name is required." });
    }
    if (!gender) {
      return res.status(400).json({ success: false, message: "Gender is required." });
    }
    if (!isValidGender(gender)) {
      return res.status(400).json({ success: false, message: "Gender must be MALE, FEMALE, or OTHER." });
    }

    const { rows } = await pool.query(
      `UPDATE users SET full_name=$1, phone=$2, address=$3, gender=$4, status=$5,
       dob=$6, whatsapp_number=$7, emergency_contact=$8, updated_at=NOW()
       WHERE id=$9 RETURNING id, full_name, email, phone, address, gender, dob, whatsapp_number, emergency_contact, status`,
      [fullName, phone, address, gender, status, dateOfBirth, whatsappNumber, emergencyContact, req.params.id]
    );
    res.json({ success: true, data: { member: rows[0] }, message: "Member updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// DELETE /api/members/:id  (soft delete → INACTIVE)
async function deactivateMember(req, res) {
  try {
    await pool.query("UPDATE users SET status='INACTIVE', updated_at=NOW() WHERE id=$1", [req.params.id]);
    await pool.query(
      "INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id) VALUES ($1,$2,$3,$4,$5)",
      [req.user.id, req.user.email, "MEMBER_DEACTIVATED", "user", req.params.id]
    );
    res.json({ success: true, message: "Member deactivated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { getMembers, getMemberById, createMember, updateMember, deactivateMember };
