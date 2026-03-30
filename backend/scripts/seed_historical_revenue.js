const pool = require("../src/config/db");
const crypto = require("crypto");

console.log("PostgreSQL Pool loaded. Starting seed...");
async function seedHistoricalRevenue() {
  console.log("🚀 Seeding historical revenue data for demo...");

  try {
    // 1. Get available subscription plans
    const { rows: plans } = await pool.query("SELECT id, name, price_etb FROM subscription_plans");
    if (plans.length === 0) {
      console.error("❌ No subscription plans found. Please run setup first.");
      process.exit(1);
    }

    // 2. Define historical months (Nov 2025 to Feb 2026)
    const months = [
      { month: 10, year: 2025, count: 4, name: "Nov" }, // Nov
      { month: 11, year: 2025, count: 6, name: "Dec" }, // Dec
      { month: 0, year: 2026, count: 8, name: "Jan" },  // Jan
      { month: 1, year: 2026, count: 12, name: "Feb" }, // Feb
    ];

    let totalInserted = 0;

    for (const m of months) {
      console.log(`📅 Seeding ${m.name} ${m.year}...`);
      for (let i = 0; i < m.count; i++) {
        const plan = plans[Math.floor(Math.random() * plans.length)];
        const day = Math.floor(Math.random() * 28) + 1;
        const createdAt = new Date(m.year, m.month, day, 10, 0, 0);
        const merchOrderId = `FS_DEMO_${m.name}_${i}_${crypto.randomBytes(4).toString('hex')}`;

        await pool.query(
          `INSERT INTO telebirr_transactions 
           (subscription_plan_id, merch_order_id, total_amount, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            plan.id,
            merchOrderId,
            plan.price_etb,
            'success',
            createdAt,
            createdAt
          ]
        );
        totalInserted++;
      }
    }

    console.log(`✅ Success! Inserted ${totalInserted} historical transactions.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding data:", err);
    process.exit(1);
  }
}

seedHistoricalRevenue();
