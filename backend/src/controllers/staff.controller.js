const pool = require("../config/db");
const bcrypt = require("bcryptjs");

// GET /api/staff
async function getStaff(_req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT id, full_name, email, phone, status, created_at FROM users WHERE role='STAFF' ORDER BY created_at DESC"
    );
    res.json({ success: true, data: { staff: rows } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// POST /api/staff
async function createStaff(req, res) {
  try {
    const { fullName, email, phone, password } = req.body;
    if (!fullName || !email || !password)
      return res.status(400).json({ success: false, message: "Full name, email and password required" });

    const existing = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (existing.rows[0])
      return res.status(400).json({ success: false, message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      "INSERT INTO users (full_name, email, password_hash, phone, role, status) VALUES ($1,$2,$3,$4,'STAFF','ACTIVE') RETURNING id, full_name, email, phone, status",
      [fullName, email, passwordHash, phone || null]
    );
    res.status(201).json({ success: true, data: { staff: rows[0] }, message: "Staff account created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// GET /api/staff/:id/permissions
async function getStaffPermissions(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT new_value FROM audit_logs WHERE entity_type='staff_permissions' AND entity_id=$1 ORDER BY created_at DESC LIMIT 1",
      [req.params.id]
    );
    const defaults = { manageMembers: false, managePayments: false, manageBookings: false, viewReports: false, managePlans: false };
    const permissions = rows[0] ? { ...defaults, ...rows[0].new_value } : defaults;
    res.json({ success: true, data: { permissions } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// PATCH /api/staff/:id/permissions
async function updateStaffPermissions(req, res) {
  try {
    const { permissions } = req.body;
    await pool.query(
      "INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id, new_value) VALUES ($1,$2,$3,$4,$5,$6)",
      [req.user.id, req.user.email, "PERMISSIONS_UPDATED", "staff_permissions", req.params.id, JSON.stringify(permissions)]
    );
    res.json({ success: true, data: { permissions }, message: "Permissions updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { getStaff, createStaff, getStaffPermissions, updateStaffPermissions };