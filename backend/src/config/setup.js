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
        gender        VARCHAR(20) CHECK (gender IN ('MALE','FEMALE','OTHER')),
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
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

    // ── Safe column additions (for existing databases) ──
    console.log("Applying schema migrations...");

    // Add gender column to users if missing
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN gender VARCHAR(20) CHECK (gender IN ('MALE','FEMALE','OTHER'));
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    // Add updated_at column to memberships if missing
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE memberships ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    console.log("Schema migrations complete.");

    // ── Performance indexes for Insights queries ──
    console.log("Creating indexes...");

    // Users indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_role             ON users(role);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_status           ON users(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_role_status      ON users(role, status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_role_dob         ON users(role, dob) WHERE dob IS NOT NULL;`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_role_gender      ON users(role, gender) WHERE gender IS NOT NULL;`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_role_created     ON users(role, created_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_role_updated     ON users(role, updated_at);`);

    // Memberships indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_memberships_plan       ON memberships(plan_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_memberships_user       ON memberships(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_memberships_fee_status ON memberships(fee_status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_memberships_batch      ON memberships(batch);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_memberships_end_date   ON memberships(end_date);`);

    // Payments indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_status        ON payments(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_paid_at       ON payments(paid_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_status_paid   ON payments(status, paid_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_status_created ON payments(status, created_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_method        ON payments(payment_method);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_membership    ON payments(membership_id);`);

    // Bookings indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_booked_at     ON bookings(booked_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_cancelled     ON bookings(cancelled);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_attended      ON bookings(attended);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_user          ON bookings(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_class         ON bookings(class_id);`);

    console.log("Indexes created.");

    // ── Seed data ──
    // Plans
    await client.query(`
      INSERT INTO plans (name, name_am, price_etb, billing_cycle, duration_days, features)
      VALUES
        ('Basic',  'መሠረታዊ', 500,  'MONTHLY',   30,  ARRAY['Gym Access', 'Locker Room']),
        ('Pro',    'ፕሮ',    1200, 'QUARTERLY', 90,  ARRAY['Gym Access', 'All Classes', 'Trainer Session']),
        ('Elite',  'ኤሊት',   4000, 'ANNUAL',    365, ARRAY['All Access', 'Personal Trainer', 'Nutrition Plan', 'Guest Passes'])
      ON CONFLICT (name) DO NOTHING;
    `);

    // Admin user
    const hash = await bcrypt.hash("password", 10);
    await client.query(`
      INSERT INTO users (full_name, email, password_hash, role, status)
      VALUES ('FitSync Admin', 'admin@fitsync.et', $1, 'ADMIN', 'ACTIVE')
      ON CONFLICT (email) DO NOTHING;
    `, [hash]);

    console.log("Core seed data verified.");

    // ── Insights demo data ──
    // Only seed if there are fewer than 5 members (avoid duplicating on re-runs)
    const memberCount = await client.query("SELECT COUNT(*)::int as count FROM users WHERE role = 'MEMBER'");
    if (memberCount.rows[0].count < 5) {
      console.log("Seeding insights demo data...");
      await seedInsightsData(client, hash);
      console.log("Insights demo data seeded.");
    } else {
      console.log("Insights demo data already present, skipping.");
    }

    console.log("Setup finished successfully.");
  } catch (err) {
    console.error("Setup error:", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// ─────────────────────────────────────────────────────
// Insights demo data: members, memberships, payments,
// classes, and bookings spread over the past 12 months
// ─────────────────────────────────────────────────────
async function seedInsightsData(client, passwordHash) {
  // Fetch plan IDs
  const plansRes = await client.query("SELECT id, name, price_etb, duration_days FROM plans ORDER BY price_etb ASC");
  const plans = plansRes.rows; // [Basic, Pro, Elite]
  if (plans.length < 3) {
    console.log("Plans not found, skipping insights seed.");
    return;
  }

  const basicPlan = plans[0];
  const proPlan   = plans[1];
  const elitePlan = plans[2];

  // Helper: random date within range
  function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  // Helper: random item from array
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  // ── 1. Create members ──
  const memberNames = [
    { name: "Abebe Kebede",     gender: "MALE",   dob: "1995-03-15" },
    { name: "Tigist Haile",     gender: "FEMALE", dob: "1998-07-22" },
    { name: "Dawit Mekonnen",   gender: "MALE",   dob: "1990-11-08" },
    { name: "Hanna Tesfaye",    gender: "FEMALE", dob: "2000-01-30" },
    { name: "Yonas Bekele",     gender: "MALE",   dob: "1988-05-12" },
    { name: "Sara Worku",       gender: "FEMALE", dob: "1997-09-05" },
    { name: "Bereket Tadesse",  gender: "MALE",   dob: "1992-12-20" },
    { name: "Meron Alemu",      gender: "FEMALE", dob: "2001-04-18" },
    { name: "Solomon Girma",    gender: "MALE",   dob: "1985-08-25" },
    { name: "Bethlehem Desta",  gender: "FEMALE", dob: "1999-06-14" },
    { name: "Nahom Zewdu",      gender: "MALE",   dob: "1993-02-28" },
    { name: "Kidist Assefa",    gender: "FEMALE", dob: "1996-10-11" },
    { name: "Ermias Wolde",     gender: "MALE",   dob: "2002-03-03" },
    { name: "Selamawit Biru",   gender: "FEMALE", dob: "1991-07-09" },
    { name: "Henok Getachew",   gender: "MALE",   dob: "1987-01-16" },
    { name: "Liya Solomon",     gender: "FEMALE", dob: "2003-11-27" },
    { name: "Mulugeta Kassa",   gender: "MALE",   dob: "1994-04-06" },
    { name: "Tsion Hailu",      gender: "FEMALE", dob: "1989-08-19" },
    { name: "Robel Abera",      gender: "MALE",   dob: "1986-12-02" },
    { name: "Feven Negash",     gender: "FEMALE", dob: "2000-05-21" },
    { name: "Amanuel Yimer",    gender: "MALE",   dob: "1997-09-30" },
    { name: "Rediet Demeke",    gender: "FEMALE", dob: "1995-02-14" },
    { name: "Tewodros Mengistu",gender: "MALE",   dob: "1983-06-08" },
    { name: "Mahlet Birhanu",   gender: "FEMALE", dob: "2001-10-25" },
    { name: "Yared Tefera",     gender: "MALE",   dob: "1998-01-05" },
    { name: "Helen Tadesse",    gender: "FEMALE", dob: "1990-07-17" },
    { name: "Girma Abebe",      gender: "MALE",   dob: "1984-11-03" },
    { name: "Bezawit Asfaw",    gender: "FEMALE", dob: "1999-03-22" },
    { name: "Dawit Sahle",      gender: "MALE",   dob: "1996-08-09" },
    { name: "Eyerusalem Worku", gender: "FEMALE", dob: "2002-12-14" },
    { name: "Mikias Gebremedhin", gender: "MALE", dob: "1993-05-29" },
    { name: "Aster Mulatu",     gender: "FEMALE", dob: "1988-04-16" },
    { name: "Biniam Tekle",     gender: "MALE",   dob: "2000-09-01" },
    { name: "Ruth Yohannes",    gender: "FEMALE", dob: "1991-01-20" },
    { name: "Kaleb Desta",      gender: "MALE",   dob: "1987-06-12" },
    { name: "Winta Berhe",      gender: "FEMALE", dob: "1994-10-07" },
    { name: "Abenezer Fikre",   gender: "MALE",   dob: "2003-02-18" },
    { name: "Rahel Gebre",      gender: "FEMALE", dob: "1992-07-31" },
    { name: "Filmon Teklu",     gender: "MALE",   dob: "1985-03-11" },
    { name: "Yodit Alem",       gender: "FEMALE", dob: "1997-11-26" },
  ];

  const paymentMethods = ["TELEBIRR", "CBE_BIRR", "CASH", "CARD"];
  const batches = ["MORNING", "AFTERNOON", "EVENING"];
  const feeStatuses = ["PAID", "PAID", "PAID", "PAID", "UNPAID", "OVERDUE"]; // weighted toward PAID

  const memberIds = [];

  for (let i = 0; i < memberNames.length; i++) {
    const m = memberNames[i];
    const email = m.name.toLowerCase().replace(/\s+/g, ".") + "@example.com";
    const signupDate = randomDate(twelveMonthsAgo, now);
    // 85% active, 15% inactive
    const status = Math.random() < 0.85 ? "ACTIVE" : "INACTIVE";
    // If inactive, updated_at is sometime after signup
    const updatedAt = status === "INACTIVE"
      ? randomDate(signupDate, now)
      : signupDate;

    const res = await client.query(`
      INSERT INTO users (full_name, email, password_hash, phone, dob, gender, role, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'MEMBER', $7, $8, $9)
      ON CONFLICT (email) DO NOTHING
      RETURNING id;
    `, [
      m.name,
      email,
      passwordHash,
      `+2519${String(10000000 + Math.floor(Math.random() * 89999999))}`,
      m.dob,
      m.gender,
      status,
      signupDate.toISOString(),
      updatedAt.toISOString(),
    ]);

    if (res.rows.length > 0) {
      memberIds.push({ id: res.rows[0].id, signupDate, status });
    }
  }

  console.log(`  → Created ${memberIds.length} members`);

  // ── 2. Create memberships + payments ──
  // Plan distribution: 50% Basic, 30% Pro, 20% Elite
  const planWeights = [
    { plan: basicPlan, weight: 0.50 },
    { plan: proPlan,   weight: 0.80 },
    { plan: elitePlan, weight: 1.00 },
  ];

  let membershipCount = 0;
  let paymentCount = 0;

  for (const member of memberIds) {
    const r = Math.random();
    const selectedPlan = planWeights.find((pw) => r < pw.weight).plan;

    const startDate = new Date(member.signupDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + selectedPlan.duration_days);

    const feeStatus = pick(feeStatuses);
    const batch = pick(batches);

    const mRes = await client.query(`
      INSERT INTO memberships (user_id, plan_id, start_date, end_date, fee_status, batch, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
      RETURNING id;
    `, [
      member.id,
      selectedPlan.id,
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0],
      feeStatus,
      batch,
      member.signupDate.toISOString(),
    ]);

    membershipCount++;
    const membershipId = mRes.rows[0].id;

    // Create payment if PAID
    if (feeStatus === "PAID") {
      const paidAt = randomDate(startDate, new Date(Math.min(endDate.getTime(), now.getTime())));
      const method = pick(paymentMethods);

      await client.query(`
        INSERT INTO payments (user_id, membership_id, amount_etb, payment_method, transaction_ref, status, paid_at, created_at)
        VALUES ($1, $2, $3, $4, $5, 'COMPLETED', $6, $6);
      `, [
        member.id,
        membershipId,
        selectedPlan.price_etb,
        method,
        `TXN-${Date.now()}-${Math.floor(Math.random() * 99999)}`,
        paidAt.toISOString(),
      ]);
      paymentCount++;
    }

    // Some members renew (create a second membership + payment cycle)
    if (Math.random() < 0.3 && endDate < now) {
      const renewStart = new Date(endDate);
      const renewEnd = new Date(renewStart);
      renewEnd.setDate(renewEnd.getDate() + selectedPlan.duration_days);
      const renewFee = pick(["PAID", "PAID", "UNPAID"]);

      const renewRes = await client.query(`
        INSERT INTO memberships (user_id, plan_id, start_date, end_date, fee_status, batch, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
        RETURNING id;
      `, [
        member.id,
        selectedPlan.id,
        renewStart.toISOString().split("T")[0],
        renewEnd.toISOString().split("T")[0],
        renewFee,
        batch,
        renewStart.toISOString(),
      ]);

      membershipCount++;

      if (renewFee === "PAID") {
        const renewPaidAt = randomDate(renewStart, new Date(Math.min(renewEnd.getTime(), now.getTime())));
        await client.query(`
          INSERT INTO payments (user_id, membership_id, amount_etb, payment_method, transaction_ref, status, paid_at, created_at)
          VALUES ($1, $2, $3, $4, $5, 'COMPLETED', $6, $6);
        `, [
          member.id,
          renewRes.rows[0].id,
          selectedPlan.price_etb,
          pick(paymentMethods),
          `TXN-${Date.now()}-${Math.floor(Math.random() * 99999)}`,
          renewPaidAt.toISOString(),
        ]);
        paymentCount++;
      }
    }
  }

  console.log(`  → Created ${membershipCount} memberships`);
  console.log(`  → Created ${paymentCount} payments`);

  // ── 3. Create classes ──
  const classNames = [
    { name: "Yoga Flow",        nameAm: "ዮጋ",       instructor: "Coach Hana",     location: "Studio A" },
    { name: "HIIT Blast",       nameAm: "ሂት",       instructor: "Coach Dawit",    location: "Main Floor" },
    { name: "Spin Cycle",       nameAm: "ስፒን",      instructor: "Coach Sara",     location: "Spin Room" },
    { name: "Strength Training",nameAm: "ጥንካሬ",     instructor: "Coach Yonas",    location: "Weight Room" },
    { name: "Boxing Basics",    nameAm: "ቦክስ",      instructor: "Coach Bereket",  location: "Ring Area" },
    { name: "Pilates Core",     nameAm: "ፒላቲስ",    instructor: "Coach Meron",    location: "Studio B" },
    { name: "CrossFit WOD",     nameAm: "ክሮስፊት",   instructor: "Coach Solomon",  location: "CrossFit Zone" },
    { name: "Zumba Dance",      nameAm: "ዙምባ",      instructor: "Coach Bethlehem",location: "Studio A" },
  ];

  const classIds = [];
  // Create classes scheduled over the past 30 days and next 7 days
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAhead = new Date(now);
  sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 7);

  // Generate class sessions across the date range
  const scheduleHours = [6, 7, 8, 9, 10, 14, 15, 16, 17, 18, 19, 20]; // gym hours

  for (const cls of classNames) {
    // Each class happens ~3 times per week over the range
    let date = new Date(thirtyDaysAgo);
    while (date <= sevenDaysAhead) {
      // Skip some days randomly (simulate 3x/week)
      if (Math.random() < 0.4) {
        const hour = pick(scheduleHours);
        const scheduleAt = new Date(date);
        scheduleAt.setHours(hour, 0, 0, 0);

        const res = await client.query(`
          INSERT INTO classes (name, name_am, instructor, location, schedule_at, duration_min, capacity, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
          RETURNING id;
        `, [
          cls.name,
          cls.nameAm,
          cls.instructor,
          cls.location,
          scheduleAt.toISOString(),
          pick([45, 60, 75, 90]),
          pick([15, 20, 25, 30]),
        ]);

        classIds.push({ id: res.rows[0].id, scheduleAt });
      }
      date.setDate(date.getDate() + 1);
    }
  }

  console.log(`  → Created ${classIds.length} class sessions`);

  // ── 4. Create bookings ──
  // Each active member books 2-6 classes
  let bookingCount = 0;
  const activeMembers = memberIds.filter((m) => m.status === "ACTIVE");
  const pastClasses = classIds.filter((c) => c.scheduleAt <= now);

  for (const member of activeMembers) {
    const numBookings = 2 + Math.floor(Math.random() * 5);
    const selectedClasses = [];

    for (let i = 0; i < numBookings && i < pastClasses.length; i++) {
      // Pick a random class that hasn't been picked for this member
      let cls;
      let attempts = 0;
      do {
        cls = pick(pastClasses);
        attempts++;
      } while (selectedClasses.includes(cls.id) && attempts < 10);

      if (selectedClasses.includes(cls.id)) continue;
      selectedClasses.push(cls.id);

      const attended = Math.random() < 0.75; // 75% attendance rate
      const cancelled = !attended && Math.random() < 0.3;

      await client.query(`
        INSERT INTO bookings (user_id, class_id, booked_at, attended, cancelled, created_at)
        VALUES ($1, $2, $3, $4, $5, $3);
      `, [
        member.id,
        cls.id,
        cls.scheduleAt.toISOString(),
        attended,
        cancelled,
      ]);
      bookingCount++;
    }
  }

  console.log(`  → Created ${bookingCount} bookings`);

  // ── 5. Staff user for demo ──
  await client.query(`
    INSERT INTO users (full_name, email, password_hash, role, status, gender)
    VALUES ('Abrham Tekle', 'staff@fitsync.et', $1, 'STAFF', 'ACTIVE', 'MALE')
    ON CONFLICT (email) DO NOTHING;
  `, [passwordHash]);

  console.log("  → Staff demo user verified.");
}

setup();
