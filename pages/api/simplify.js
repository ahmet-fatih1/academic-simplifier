import { ensureSchema, query } from "../../lib/db";

const isProStatus = (status, cancelled) => {
  if (cancelled) return false;
  return status === "active" || status === "on_trial" || status === "trialing";
};

const getClientIdentity = (req, email) => {
  if (email) return `email:${email}`;
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.socket?.remoteAddress || "unknown";
  return `ip:${ip}`;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, model, task, language, level, terms, reductionTarget, email } =
    req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY bulunamadı!" });
  }

  try {
    // DOĞRU MODEL: gemini-2.5-flash
    const selectedModel =
      model === "quality" ? "gemini-2.5-pro" : "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1/models/${selectedModel}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const selectedTask =
      task === "summary" || task === "verify" || task === "bundle"
        ? task
        : "simplify";
    const targetLevel = level || "B1";
    const targetLanguage = language || "English";
    const protectedTerms =
      Array.isArray(terms) && terms.length
        ? terms
            .map((item) => String(item).trim())
            .filter(Boolean)
            .slice(0, 20)
        : [];

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

    if (!isPro && selectedTask === "simplify") {
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
      if (count > 3) {
        return res.status(429).json({
          error: "Free limit reached. Upgrade to Pro for unlimited use.",
        });
      }
    }

    if (selectedTask === "bundle") {
      if (!text || typeof text !== "object") {
        return res.status(400).json({ error: "Invalid bundle payload" });
      }
      if (!text.original || !text.simplified) {
        return res.status(400).json({ error: "Bundle requires original+simple" });
      }
    }

    let prompt = "";
    if (selectedTask === "summary") {
      prompt = `Create a concise visual summary in 3-5 bullet points. Keep meaning accurate and use plain ${targetLanguage}:\n\n${text}`;
    } else if (selectedTask === "verify") {
      prompt = `Compare the original and simplified text for meaning preservation.
Return a JSON object with keys: match (boolean), risk ("low"|"medium"|"high"), notes (string).
Original:
${text.original}

Simplified:
${text.simplified}`;
    } else if (selectedTask === "bundle") {
      prompt = `You are given original and simplified text. Return JSON with keys:
summary (array of 3-5 bullet strings, plain ${targetLanguage}),
meaning (object with match boolean, risk "low"|"medium"|"high", notes string).
Original:
${text.original}

Simplified:
${text.simplified}`;
    } else {
      const termsLine = protectedTerms.length
        ? `Preserve these terms exactly as written: ${protectedTerms.join(", ")}.\n`
        : "";
      const reductionValue =
        typeof reductionTarget === "number"
          ? Math.max(0, Math.min(70, Math.round(reductionTarget)))
          : null;
      const reductionLine =
        reductionValue !== null
          ? `Aim for roughly ${reductionValue}% shorter than the original.\n`
          : "";
      prompt = `Rewrite this in very simple ${targetLanguage} (${targetLevel} level). Keep meaning, use short sentences, and be concise.\n${termsLine}${reductionLine}\n${text}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens:
            selectedTask === "summary" ? 256 : selectedTask === "bundle" ? 384 : 512,
        },
      }),
    });

    const responseText = await response.text();
    console.log("Response status:", response.status);

    if (!response.ok) {
      if (selectedModel === "gemini-2.5-pro") {
        const fallbackUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const fallback = await fetch(fallbackUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens:
                selectedTask === "summary"
                  ? 256
                  : selectedTask === "bundle"
                    ? 384
                    : 512,
            },
          }),
        });

        const fallbackText = await fallback.text();
        if (fallback.ok) {
          const data = JSON.parse(fallbackText);
          const result =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Sonuç bulunamadı";
          if (selectedTask === "bundle") {
            let parsed = null;
            try {
              parsed = JSON.parse(result);
            } catch (_) {
              parsed = null;
            }
            const summary = Array.isArray(parsed?.summary) ? parsed.summary : [];
            const meaning = parsed?.meaning
              ? {
                  match: Boolean(parsed.meaning.match),
                  risk: String(parsed.meaning.risk || "medium").toLowerCase(),
                  notes: String(parsed.meaning.notes || ""),
                }
              : null;
            return res.status(200).json({ result: { summary, meaning } });
          }
          return res.status(200).json({ result });
        }
      }

      console.error("Gemini hatası:", responseText);
      return res.status(response.status).json({
        error: "Gemini API hatası",
        details: responseText,
      });
    }

    const data = JSON.parse(responseText);
    const result =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sonuç bulunamadı";

    if (selectedTask === "verify") {
      let parsed = null;
      try {
        parsed = JSON.parse(result);
      } catch (_) {
        const match =
          /match\s*:\s*true/i.test(result) ||
          /"match"\s*:\s*true/i.test(result);
        const riskMatch = result.match(/risk"\s*:\s*"(low|medium|high)"/i);
        parsed = {
          match,
          risk: riskMatch ? riskMatch[1].toLowerCase() : "medium",
          notes: result.slice(0, 280),
        };
      }
      return res.status(200).json({ result: parsed });
    }

    if (selectedTask === "bundle") {
      let parsed = null;
      try {
        parsed = JSON.parse(result);
      } catch (_) {
        parsed = null;
      }

      let summary = [];
      let meaning = null;

      if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed.summary)) {
          summary = parsed.summary.map((item) => String(item).trim()).filter(Boolean);
        } else if (typeof parsed.summary === "string") {
          summary = parsed.summary
            .split(/\r?\n/)
            .map((line) => line.replace(/^[-•\d.]+\s*/, "").trim())
            .filter(Boolean);
        }

        if (parsed.meaning && typeof parsed.meaning === "object") {
          meaning = {
            match: Boolean(parsed.meaning.match),
            risk: String(parsed.meaning.risk || "medium").toLowerCase(),
            notes: String(parsed.meaning.notes || ""),
          };
        }
      }

      if (!meaning) {
        const match =
          /match\s*:\s*true/i.test(result) ||
          /"match"\s*:\s*true/i.test(result);
        const riskMatch = result.match(/risk"\s*:\s*"(low|medium|high)"/i);
        meaning = {
          match,
          risk: riskMatch ? riskMatch[1].toLowerCase() : "medium",
          notes: result.slice(0, 280),
        };
      }

      return res.status(200).json({ result: { summary, meaning } });
    }

    res.status(200).json({ result });
  } catch (error) {
    console.error("Hata:", error);
    res.status(500).json({
      error: "Hata oluştu",
      details: error.message,
    });
  }
}
