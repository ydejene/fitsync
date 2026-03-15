require("dotenv").config();
const pool = require("./db");
const bcrypt = require("bcryptjs");

async function setup() {
  const client = await pool.connect();
  try {
    console.log("Preparing database...");

    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    console.log("Checking and creating tables...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name     VARCHAR(255) NOT NULL,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone         VARCHAR(50),
        address       TEXT,
        dob           DATE,
        role          VARCHAR(20) NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('ADMIN','STAFF','MEMBER')),
        status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name          VARCHAR(100) UNIQUE NOT NULL,
        name_am       VARCHAR(100),
        price_etb     NUMERIC(10,2) NOT NULL,
        billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('MONTHLY','QUARTERLY','ANNUAL')),
        duration_days INT NOT NULL,
        features      TEXT[],
        is_active     BOOLEAN NOT NULL DEFAULT TRUE,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS memberships (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id     UUID NOT NULL REFERENCES plans(id),
        start_date  DATE NOT NULL,
        end_date    DATE NOT NULL,
        fee_status  VARCHAR(20) NOT NULL DEFAULT 'UNPAID' CHECK (fee_status IN ('PAID','UNPAID','OVERDUE')),
        batch       VARCHAR(20) NOT NULL DEFAULT 'MORNING' CHECK (batch IN ('MORNING','AFTERNOON','EVENING')),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id),
        membership_id   UUID REFERENCES memberships(id),
        amount_etb      NUMERIC(10,2) NOT NULL,
        payment_method  VARCHAR(30) CHECK (payment_method IN ('TELEBIRR','CBE_BIRR','CASH','CARD')),
        transaction_ref VARCHAR(255),
        status          VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING','COMPLETED','FAILED','REFUNDED')),
        notes           TEXT,
        paid_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name          VARCHAR(100) NOT NULL,
        name_am       VARCHAR(100),
        instructor    VARCHAR(100),
        location      VARCHAR(100),
        schedule_at   TIMESTAMPTZ NOT NULL,
        duration_min  INT NOT NULL DEFAULT 60,
        capacity      INT NOT NULL DEFAULT 20,
        is_active     BOOLEAN NOT NULL DEFAULT TRUE,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id),
        class_id    UUID REFERENCES classes(id),
        booked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        attended    BOOLEAN NOT NULL DEFAULT FALSE,
        cancelled   BOOLEAN NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id     UUID REFERENCES users(id),
        actor_email  VARCHAR(255),
        action       VARCHAR(100) NOT NULL,
        entity_type  VARCHAR(50),
        entity_id    UUID,
        old_value    JSONB,
        new_value    JSONB,
        ip_address   VARCHAR(50),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log("Database schema check complete.");

    await client.query(`
      INSERT INTO plans (name, name_am, price_etb, billing_cycle, duration_days, features)
      VALUES
        ('Basic',  'መሠረታዊ', 500,  'MONTHLY',   30,  ARRAY['Gym Access', 'Locker Room']),
        ('Pro',    'ፕሮ',    1200, 'QUARTERLY', 90,  ARRAY['Gym Access', 'All Classes', 'Trainer Session']),
        ('Elite',  'ኤሊት',   4000, 'ANNUAL',    365, ARRAY['All Access', 'Personal Trainer', 'Nutrition Plan', 'Guest Passes'])
      ON CONFLICT (name) DO NOTHING;
    `);

    const hash = await bcrypt.hash("password", 10);
    await client.query(`
      INSERT INTO users (full_name, email, password_hash, role, status)
      VALUES ('FitSync Admin', 'admin@fitsync.et', $1, 'ADMIN', 'ACTIVE')
      ON CONFLICT (email) DO NOTHING;
    `, [hash]);

    console.log("Seed data verified.");
    console.log("Setup finished successfully.");
  } catch (err) {
    console.error("Setup error:", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

setup();