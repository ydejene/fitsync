const pool = require("./src/config/db");
const crypto = require("crypto");

async function seedHistoricalRevenue() {
  console.log("🚀 Starting detailed dashboard enrichment (with fix for user_id constraint)...");

  try {
    // Get available subscription plans
    const { rows: plans } = await pool.query("SELECT id, name, price_etb FROM subscription_plans");
    if (plans.length === 0) {
      console.error("❌ No plans found");
      process.exit(1);
    }

    // Get available gym owners (user_id is NOT NULL in telebirr_transactions)
    const { rows: owners } = await pool.query("SELECT id FROM users WHERE role='OWNER' LIMIT 5");
    if (owners.length === 0) {
      console.error("❌ No gym owners (OWNER role) found in database. Please run setup or register a gym first.");
      process.exit(1);
    }

    // Historical months for demo (Nov 2025 to Feb 2026)
    const dataPoints = [
      { month: 10, year: 2025, name: 'Nov' },
      { month: 11, year: 2025, name: 'Dec' },
      { month: 0, year: 2026, name: 'Jan' },
      { month: 1, year: 2026, name: 'Feb' },
    ];

    let totalInserted = 0;

    for (const dp of dataPoints) {
      // Create a growth trend: 3 -> 6 -> 10 -> 14
      const count = dp.month === 10 ? 3 : dp.month === 11 ? 5 : dp.month === 0 ? 8 : 12;
      console.log(`📅 Generating ${count} transactions for ${dp.name} ${dp.year}...`);

      for (let i = 0; i < count; i++) {
        const plan = plans[i % plans.length]; // Mix of plans
        const owner = owners[i % owners.length]; // Distribute among owners
        const day = Math.floor(Math.random() * 25) + 1;
        const mockDate = new Date(dp.year, dp.month, day, 10, 0, 0);
        const orderId = `FS_SEED_${dp.name}_${i}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        await pool.query(
          `INSERT INTO telebirr_transactions 
           (user_id, subscription_plan_id, merch_order_id, total_amount, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (merch_order_id) DO NOTHING`,
          [
            owner.id,
            plan.id,
            orderId,
            plan.price_etb,
            'success',
            mockDate,
            mockDate
          ]
        );
        totalInserted++;
      }
    }

    console.log(`✅ Success! Backfilled ${totalInserted} records correctly.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ FAILED:", err);
    process.exit(1);
  }
}

seedHistoricalRevenue();
