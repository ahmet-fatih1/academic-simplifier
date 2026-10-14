import { query } from "./db";

export const isProStatus = (status, cancelled) => {
  if (cancelled) return false;
  return status === "active" || status === "on_trial" || status === "trialing";
};

export const getClientIdentity = (req, email, prefix = "") => {
  if (email) return `${prefix}email:${email}`;
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.socket?.remoteAddress || "unknown";
  return `${prefix}ip:${ip}`;
};

export const parseProtectedTerms = (terms) => {
  if (!Array.isArray(terms)) return [];
  return terms
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 20);
};

export const checkProStatus = async (email) => {
  if (!email) return false;
  const variantId = Number(process.env.LEMON_SQUEEZY_VARIANT_ID || 0);
  const { rows } = await query(
    `
      SELECT status, cancelled
      FROM subscriptions
      WHERE email = $1
      ${variantId ? "AND variant_id = $2" : ""}
      ORDER BY updated_at DESC NULLS LAST, last_event_at DESC
      LIMIT 1
    `,
    variantId ? [email, variantId] : [email],
  );
  const record = rows[0] || null;
  return record ? isProStatus(record.status, record.cancelled) : false;
};

export const checkRateLimit = async (identity, limit) => {
  const today = new Date().toISOString().slice(0, 10);
  const { rows } = await query(
    `
      INSERT INTO usage_limits (identity, day, count, updated_at)
      VALUES ($1, $2, 1, NOW())
      ON CONFLICT (identity, day)
      DO UPDATE SET count = usage_limits.count + 1, updated_at = NOW()
      RETURNING count
    `,
    [identity, today],
  );
  const count = rows[0]?.count ?? 0;
  return count > limit;
};
