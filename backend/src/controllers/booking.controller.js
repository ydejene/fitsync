// Branch: feature/bookings  |  Owner: Derrick
const pool = require("../config/db");

// GET /api/bookings
async function getClasses(_req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT c.*,
             COUNT(b.id) FILTER (WHERE b.cancelled = FALSE) AS booked_count
      FROM classes c
      LEFT JOIN bookings b ON b.class_id = c.id
      WHERE c.is_active = TRUE
      GROUP BY c.id
      ORDER BY c.schedule_at ASC
    `);
    res.json({ success: true, data: { classes: rows } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// POST /api/bookings  — create a new class (admin/staff)
async function createClass(req, res) {
  try {
    const { name, nameAm, instructor, location, scheduleAt, durationMin = 60, capacity = 20 } = req.body;
    if (!name || !scheduleAt)
      return res.status(400).json({ success: false, message: "Name and schedule required" });

    const { rows } = await pool.query(
      `INSERT INTO classes (name, name_am, instructor, location, schedule_at, duration_min, capacity)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, nameAm || null, instructor || null, location || null, scheduleAt, durationMin, capacity]
    );
    res.status(201).json({ success: true, data: { fitnessClass: rows[0] }, message: "Class created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// POST /api/bookings/book  — book a spot in a class (member)
async function bookClass(req, res) {
  try {
    const { classId } = req.body;
    if (!classId)
      return res.status(400).json({ success: false, message: "classId required" });

    const { rows: cls } = await pool.query(
      "SELECT *, (SELECT COUNT(*) FROM bookings WHERE class_id=$1 AND cancelled=FALSE) AS booked_count FROM classes WHERE id=$1",
      [classId]
    );
    if (!cls[0]) return res.status(404).json({ success: false, message: "Class not found" });
    if (parseInt(cls[0].booked_count) >= cls[0].capacity)
      return res.status(400).json({ success: false, message: "Class is full" });

    const { rows } = await pool.query(
      "INSERT INTO bookings (user_id, class_id) VALUES ($1,$2) RETURNING *",
      [req.user.id, classId]
    );
    res.status(201).json({ success: true, data: { booking: rows[0] }, message: "Booked successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { getClasses, createClass, bookClass };