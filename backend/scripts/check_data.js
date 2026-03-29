const pool = require("./src/config/db");
async function checkData() {
  try {
    const res = await pool.query("SELECT TO_CHAR(created_at, 'Mon YYYY') as month, COUNT(*), SUM(total_amount) FROM telebirr_transactions WHERE status='success' GROUP BY month;");
    console.log("Monthly Transaction Data:");
    console.table(res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkData();
