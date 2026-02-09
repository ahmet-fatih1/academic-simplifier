import crypto from "node:crypto";
import { ensureSchema, query } from "../../../lib/db";

export const config = {
  api: { bodyParser: false },
};

const readRawBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
};

const timingSafeEqual = (a, b) => {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.LEMON_SQUEEZY_SIGNING_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Missing webhook secret" });
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers["x-signature"];

  if (!signature || typeof signature !== "string") {
    return res.status(401).json({ error: "Missing signature" });
  }

  const computed = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (!timingSafeEqual(Buffer.from(computed), Buffer.from(signature))) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  let payload = null;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  const eventName = payload?.meta?.event_name;
  const data = payload?.data;
  const attributes = data?.attributes || {};

  if (!eventName || !data?.id) {
    return res.status(200).json({ ok: true });
  }

  const variantId = Number(process.env.LEMON_SQUEEZY_VARIANT_ID || 0);
  const payloadVariant = Number(attributes?.variant_id || 0);

  if (variantId && payloadVariant && variantId !== payloadVariant) {
    return res.status(200).json({ ok: true });
  }

  const subscriptionId = data?.id ? String(data.id) : null;
  const email =
    attributes?.user_email ||
    attributes?.customer_email ||
    attributes?.email ||
    null;
  const normalizedEmail = email ? String(email).toLowerCase() : null;

  await ensureSchema();

  if (eventName.startsWith("subscription_") && subscriptionId) {
    const status = attributes?.status || null;
    const cancelled = Boolean(attributes?.cancelled);
    const customerId = attributes?.customer_id ? String(attributes.customer_id) : null;
    const orderId = attributes?.order_id ? String(attributes.order_id) : null;
    const productId = attributes?.product_id ? String(attributes.product_id) : null;
    const testMode = Boolean(attributes?.test_mode);

    await query(
      `
        INSERT INTO subscriptions (
          subscription_id,
          email,
          variant_id,
          status,
          cancelled,
          customer_id,
          order_id,
          product_id,
          test_mode,
          last_event,
          last_event_at,
          updated_at,
          raw
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW(),$11)
        ON CONFLICT (subscription_id) DO UPDATE SET
          email = EXCLUDED.email,
          variant_id = EXCLUDED.variant_id,
          status = EXCLUDED.status,
          cancelled = EXCLUDED.cancelled,
          customer_id = EXCLUDED.customer_id,
          order_id = EXCLUDED.order_id,
          product_id = EXCLUDED.product_id,
          test_mode = EXCLUDED.test_mode,
          last_event = EXCLUDED.last_event,
          last_event_at = NOW(),
          updated_at = NOW(),
          raw = EXCLUDED.raw;
      `,
      [
        subscriptionId,
        normalizedEmail,
        payloadVariant || variantId || null,
        status,
        cancelled,
        customerId,
        orderId,
        productId,
        testMode,
        eventName,
        payload,
      ]
    );
  }

  return res.status(200).json({ ok: true });
}
