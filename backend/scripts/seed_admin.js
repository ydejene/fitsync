require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");

(async () => {
  try {
    const hash = await bcrypt.hash("12345678", 10);

    // Update old admin email if it exists
    await pool.query(
      "UPDATE users SET email = $1, password_hash = $2 WHERE email = $3",
      ["admin@fitsync.io", hash, "admin@fitsync.et"]
    );

    // Upsert: insert or update password
    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET password_hash = $3`,
      ["FitSync Admin", "admin@fitsync.io", hash, "ADMIN", "ACTIVE"]
    );

    console.log("Admin user ready: admin@fitsync.io / 12345678");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
})();
