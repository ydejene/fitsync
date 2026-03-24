require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("./src/config/db");

async function runMigration() {
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, "src", "config", "migration_telebirr.sql");
    console.log(`Reading SQL from ${sqlPath}...`);
    const sql = fs.readFileSync(sqlPath, "utf8");
    
    console.log("Running migration...");
    await client.query(sql);
    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
