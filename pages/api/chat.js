import { ensureSchema, query } from "../../lib/db";
import { buildChatSystemPrompt } from "../../lib/chat-prompt";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGES = 50;
const MAX_CONTEXT_CHARS = 20000;
const CHAT_LIMIT_PER_DAY = 10;

const isProStatus = (status, cancelled) => {
  if (cancelled) return false;
  return status === "active" || status === "on_trial" || status === "trialing";
};

const getClientIdentity = (req, email) => {
  if (email) return `chat:email:${email}`;
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.socket?.remoteAddress || "unknown";
  return `chat:ip:${ip}`;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY bulunamadı!" });
  }

  const { messages, context, model, personaId, email } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  if (messages.length > MAX_MESSAGES) {
    return res.status(400).json({ error: "Too many messages" });
  }

  if (!context || !context.original || !context.simplified) {
    return res.status(400).json({ error: "Context (original + simplified) is required" });
  }

  const totalContextLen = String(context.original).length + String(context.simplified).length;
  if (totalContextLen > MAX_CONTEXT_CHARS) {
    return res.status(400).json({ error: "Context too large" });
  }

  for (const msg of messages) {
    if (!msg.role || !["user", "model"].includes(msg.role)) {
      return res.status(400).json({ error: "Invalid message role" });
    }
    if (!msg.content || typeof msg.content !== "string") {
      return res.status(400).json({ error: "Invalid message content" });
    }
    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: "Message too long (max 2000 characters)" });
    }
  }

  const lastMsg = messages[messages.length - 1];
  if (lastMsg.role !== "user") {
    return res.status(400).json({ error: "Last message must be from user" });
  }

  try {
    await ensureSchema();
    const normalizedEmail =
      typeof email === "string" && email.trim() ? email.trim().toLowerCase() : null;

    let isPro = false;
    if (normalizedEmail) {
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
        variantId ? [normalizedEmail, variantId] : [normalizedEmail]
      );
      const record = rows[0] || null;
      isPro = record ? isProStatus(record.status, record.cancelled) : false;
    }

    if (!isPro) {
      const identity = getClientIdentity(req, normalizedEmail);
      const today = new Date().toISOString().slice(0, 10);
      const { rows } = await query(
        `
          INSERT INTO usage_limits (identity, day, count, updated_at)
          VALUES ($1, $2, 1, NOW())
          ON CONFLICT (identity, day)
          DO UPDATE SET count = usage_limits.count + 1, updated_at = NOW()
          RETURNING count
        `,
        [identity, today]
      );
      const count = rows[0]?.count ?? 0;
      if (count > CHAT_LIMIT_PER_DAY) {
        return res.status(429).json({
          error: "Chat limit reached (10/day). Upgrade to Pro for unlimited.",
        });
      }
    }

    const selectedModel =
      model === "quality" && isPro ? "gemini-2.5-pro" : "gemini-2.5-flash";

    const systemPrompt = buildChatSystemPrompt(
      context.original,
      context.simplified,
      personaId
    );

    const contents = messages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini chat hatası:", errText);
      return res.status(geminiResponse.status).json({
        error: "Gemini API error",
        details: errText,
      });
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    });

    const reader = geminiResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const data = JSON.parse(raw);
            const text =
              data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (text) {
              res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
          } catch (_) {
            // malformed chunk, skip
          }
        }
      }

      if (buffer.startsWith("data: ")) {
        try {
          const data = JSON.parse(buffer.slice(6).trim());
          const text =
            data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        } catch (_) {
          // skip
        }
      }
    } catch (streamErr) {
      console.error("Stream read error:", streamErr);
    } finally {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error("Chat hatası:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Chat error occurred",
        details: error.message,
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
}
