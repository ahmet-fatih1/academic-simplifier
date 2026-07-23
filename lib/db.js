import { Pool } from "pg";

let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 30000,
  });
  pool.on("error", (err) => {
    console.error("Unexpected pool idle error:", err.message);
  });
} catch (err) {
  console.error("Failed to create database pool:", err.message);
  pool = null;
}

export const query = (text, params) => {
  if (!pool) return Promise.reject(new Error("Database not configured"));
  return pool.query(text, params);
};

let schemaReady = false;

export const ensureSchema = async () => {
  if (schemaReady) return;
  await query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      subscription_id TEXT UNIQUE,
      email TEXT,
      variant_id BIGINT,
      status TEXT,
      cancelled BOOLEAN,
      customer_id TEXT,
      order_id TEXT,
      product_id TEXT,
      test_mode BOOLEAN,
      last_event TEXT,
      last_event_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      raw JSONB
    );
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS subscriptions_email_idx
    ON subscriptions (email);
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS subscriptions_variant_idx
    ON subscriptions (variant_id);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS usage_limits (
      id SERIAL PRIMARY KEY,
      identity TEXT NOT NULL,
      day DATE NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (identity, day)
    );
  `);
  schemaReady = true;
};
