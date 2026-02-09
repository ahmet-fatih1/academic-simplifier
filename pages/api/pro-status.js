import { ensureSchema, query } from "../../lib/db";

const isProStatus = (status, cancelled) => {
  if (cancelled) return false;
  return status === "active" || status === "on_trial" || status === "trialing";
};

export default async function handler(req, res) {
  const email =
    req.method === "POST" ? req.body?.email : req.query?.email;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const variantId = Number(process.env.LEMON_SQUEEZY_VARIANT_ID || 0);

  await ensureSchema();

  const { rows } = await query(
    `
      SELECT status, cancelled, last_event, last_event_at
      FROM subscriptions
      WHERE email = $1
      ${variantId ? "AND variant_id = $2" : ""}
      ORDER BY updated_at DESC NULLS LAST, last_event_at DESC
      LIMIT 1
    `,
    variantId ? [normalizedEmail, variantId] : [normalizedEmail]
  );

  const record = rows[0] || null;
  const isPro = record ? isProStatus(record.status, record.cancelled) : false;

  return res.status(200).json({
    isPro,
    status: record?.status || null,
    lastEvent: record?.last_event || null,
    lastEventAt: record?.last_event_at || null,
  });
}
