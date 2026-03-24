-- ============================================================================
-- FitSync – Telebirr B2B Payment Integration Migration
-- Adds subscription management and telebirr transaction tracking tables
-- Run: psql -U postgres -d fitsync_db_dev -f migration_telebirr.sql
-- ============================================================================

-- 1. Add 'OWNER' to the users.role CHECK constraint and subscription fields
-- Drop old constraint, add new one that includes OWNER
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('ADMIN','STAFF','MEMBER','OWNER'));

-- Add subscription tracking columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status
  VARCHAR(20) DEFAULT 'pending'
  CHECK (subscription_status IN ('pending','active','expired','cancelled'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_start DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end DATE;

-- 2. B2B Subscription Plans (separate from C2B gym membership plans)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) UNIQUE NOT NULL,
  description   TEXT,
  price_etb     NUMERIC(10,2) NOT NULL,
  billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('MONTHLY','HALF_YEARLY','YEARLY')),
  duration_days INT NOT NULL,
  features      TEXT[],
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK from users to subscription_plans
ALTER TABLE users ADD CONSTRAINT fk_subscription_plan
  FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id);

-- 3. Telebirr transaction audit log (gateway-level detail)
CREATE TABLE IF NOT EXISTS telebirr_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id),
  payment_id        UUID REFERENCES payments(id),
  subscription_plan_id UUID REFERENCES subscription_plans(id),
  merch_order_id    VARCHAR(64) UNIQUE NOT NULL,
  prepay_id         VARCHAR(128),
  payment_order_id  VARCHAR(100),
  total_amount      NUMERIC(10,2) NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','success','failed','timeout')),
  request_payload   JSONB,
  response_payload  JSONB,
  webhook_payload   JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast webhook lookup by merch_order_id
CREATE INDEX IF NOT EXISTS idx_telebirr_merch_order
  ON telebirr_transactions(merch_order_id);

-- 4. Seed B2B subscription plans
INSERT INTO subscription_plans (name, description, price_etb, billing_cycle, duration_days, features)
VALUES
  ('Monthly',     'Monthly subscription to FitSync platform',  2500, 'MONTHLY',     30,  ARRAY['Full Dashboard', 'Up to 100 Members', 'Payment Tracking', 'Class Scheduling']),
  ('Half-Yearly', '6-month subscription to FitSync platform', 12000, 'HALF_YEARLY', 180, ARRAY['Full Dashboard', 'Up to 500 Members', 'Payment Tracking', 'Class Scheduling', 'Analytics', 'Priority Support']),
  ('Yearly',      'Annual subscription to FitSync platform',  20000, 'YEARLY',      365, ARRAY['Full Dashboard', 'Unlimited Members', 'Payment Tracking', 'Class Scheduling', 'Advanced Analytics', 'Priority Support', 'Custom Branding'])
ON CONFLICT (name) DO NOTHING;
