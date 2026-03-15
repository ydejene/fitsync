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

// GET /api/bookings/:id — Get specific class details
async function getClassById(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT c.*, 
              COUNT(b.id) FILTER (WHERE b.cancelled = FALSE) AS booked_count 
       FROM classes c 
       LEFT JOIN bookings b ON b.class_id = c.id 
       WHERE c.id = $1 
       GROUP BY c.id`, 
      [id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: "Class not found" });
    res.json({ success: true, data: { fitnessClass: rows[0] } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// PATCH /api/bookings/:id — Update class info (Admin/Staff)
async function updateClass(req, res) {
  try {
    const { id } = req.params;
    const { name, nameAm, instructor, location, scheduleAt, durationMin, capacity, isActive } = req.body;
    
    const { rows } = await pool.query(
      `UPDATE classes 
       SET name = COALESCE($1, name), 
           name_am = COALESCE($2, name_am), 
           instructor = COALESCE($3, instructor), 
           location = COALESCE($4, location), 
           schedule_at = COALESCE($5, schedule_at), 
           duration_min = COALESCE($6, duration_min), 
           capacity = COALESCE($7, capacity),
           is_active = COALESCE($8, is_active)
       WHERE id = $9 RETURNING *`,
      [name, nameAm, instructor, location, scheduleAt, durationMin, capacity, isActive, id]
    );

    if (!rows[0]) return res.status(404).json({ success: false, message: "Class not found" });
    res.json({ success: true, data: { fitnessClass: rows[0] }, message: "Class updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// PATCH /api/bookings/:id/booking/:bookingId — Cancel or Update a booking
async function updateBooking(req, res) {
  try {
    const { bookingId } = req.params;
    const { cancelled } = req.body; // Usually used to cancel a booking

    const { rows } = await pool.query(
      "UPDATE bookings SET cancelled = $1 WHERE id = $2 RETURNING *",
      [cancelled, bookingId]
    );

    if (!rows[0]) return res.status(404).json({ success: false, message: "Booking not found" });
    res.json({ success: true, data: { booking: rows[0] }, message: "Booking updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { getClasses, createClass, bookClass };