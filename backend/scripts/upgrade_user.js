const pool = require("../src/config/db");

async function upgradeUser(email) {
  try {
    const result = await pool.query(
      "UPDATE users SET role = 'ADMIN' WHERE email = $1 RETURNING *",
      [email]
    );
    if (result.rowCount === 0) {
      console.log(`User with email ${email} not found.`);
    } else {
      console.log(`User ${email} upgraded to ADMIN.`);
      console.log(result.rows[0]);
    }
  } catch (err) {
    console.error("Error upgrading user:", err);
  } finally {
    await pool.end();
  }
}

const email = process.argv[2];
if (!email) {
  console.log("Please provide an email address.");
  process.exit(1);
}

upgradeUser(email);
