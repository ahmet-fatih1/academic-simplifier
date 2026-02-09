import { useEffect, useMemo, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { Fraunces, Manrope } from "next/font/google";
import { jsPDF } from "jspdf";
import styles from "../styles/Home.module.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const SAMPLE_TEXT =
  "Academic discourse often relies on dense terminology, which can make important ideas hard to access for non-specialists. This tool rewrites such text in clear, everyday English without changing the meaning.";

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useCount, setUseCount] = useState(0);
  const [latencyMs, setLatencyMs] = useState(null);
  const [copyStatus, setCopyStatus] = useState("idle");
  const [showCompare, setShowCompare] = useState(true);
  const [history, setHistory] = useState([]);
  const [model, setModel] = useState("fast");
  const [summaryItems, setSummaryItems] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [meaningCheck, setMeaningCheck] = useState(null);
  const [meaningLoading, setMeaningLoading] = useState(false);
  const [meaningError, setMeaningError] = useState("");
  const [protectedTerms, setProtectedTerms] = useState("");
  const [reductionTarget, setReductionTarget] = useState(30);
  const [isPro, setIsPro] = useState(false);
  const [proEmail, setProEmail] = useState("");
  const [proStatus, setProStatus] = useState(null);
  const [proLoading, setProLoading] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem("is_pro");
    if (stored === "true") {
      setIsPro(true);
    }

    const savedEmail = localStorage.getItem("pro_email");
    if (savedEmail) {
      setProEmail(savedEmail);
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("pro") === "1") {
      localStorage.setItem("is_pro", "true");
      setIsPro(true);
    }

    const emailParam = params.get("email");
    if (emailParam) {
      setProEmail(emailParam);
      localStorage.setItem("pro_email", emailParam);
    }
  }, []);

  useEffect(() => {
    if (!proEmail) return;
    handleProCheck();
  }, [proEmail]);

  const remaining = Math.max(0, 3 - useCount);
  useEffect(() => {
    const stored = localStorage.getItem("simplify_history");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(
            parsed.map((entry) => ({
              pinned: false,
              ...entry,
            }))
          );
        }
      } catch (_) {
        setHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("simplify_history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        handleSimplify();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        handleClear();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [text, useCount]);

  const textStats = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      return { words: 0, chars: 0 };
    }
    return {
      words: trimmed.split(/\s+/).length,
      chars: trimmed.length,
    };
  }, [text]);

  const outputStats = useMemo(() => {
    const trimmed = result.trim();
    if (!trimmed) {
      return { words: 0, chars: 0, minutes: 0 };
    }
    const words = trimmed.split(/\s+/).length;
    return {
      words,
      chars: trimmed.length,
      minutes: Math.max(1, Math.round(words / 200)),
    };
  }, [result]);

  const reductionPct = useMemo(() => {
    if (!textStats.words || !outputStats.words) return 0;
    const pct = ((textStats.words - outputStats.words) / textStats.words) * 100;
    return Math.max(0, Math.round(pct));
  }, [textStats.words, outputStats.words]);

  const sortedHistory = useMemo(() => {
    const copy = [...history];
    return copy.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.createdAt - a.createdAt;
    });
  }, [history]);

  const protectedTermList = useMemo(() => {
    return protectedTerms
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [protectedTerms]);

  const handleSimplify = async () => {
    if (!isPro && useCount >= 3) {
      setError("Free limit reached. Upgrade to Pro for unlimited use.");
      return;
    }

    if (!text.trim()) {
      setError("Please paste or type a text first.");
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");
    setResult("");
    setLatencyMs(null);
    setSummaryItems([]);
    setSummaryError("");
    setMeaningCheck(null);
    setMeaningError("");

    const start = performance.now();

    try {
      const res = await fetch("/api/simplify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model,
          reductionTarget: isPro ? reductionTarget : undefined,
          email: proEmail || undefined,
          terms: protectedTerms
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult(data.result);
      setUseCount((prev) => prev + 1);
      setLatencyMs(Math.round(performance.now() - start));
      setHistory((prev) => {
        const next = [
          {
            id:
              typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            input: text,
            output: data.result,
            createdAt: Date.now(),
            pinned: false,
          },
          ...prev,
        ];
        return next.slice(0, 5);
      });

      setSummaryLoading(true);
      setMeaningLoading(true);
      try {
        const summaryRes = await fetch("/api/simplify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            task: "bundle",
            model,
            text: { original: text, simplified: data.result },
          }),
        });

        const summaryData = await summaryRes.json();
        if (!summaryRes.ok) {
          throw new Error(summaryData.error || "Summary failed");
        }

        const bundle = summaryData.result || {};
        setSummaryItems(bundle.summary || []);
        setMeaningCheck(bundle.meaning || null);
      } catch (summaryErr) {
        setSummaryError(summaryErr.message);
        setMeaningError(summaryErr.message);
      } finally {
        setMeaningLoading(false);
        setSummaryLoading(false);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message);
        console.error("Error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSample = () => {
    setText(SAMPLE_TEXT);
    setError("");
  };

  const handleClear = () => {
    setText("");
    setResult("");
    setError("");
    setLatencyMs(null);
    setSummaryItems([]);
    setSummaryError("");
    setMeaningCheck(null);
    setMeaningError("");
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 1500);
    } catch (err) {
      setCopyStatus("failed");
      setTimeout(() => setCopyStatus("idle"), 1500);
    }
  };

  const handleCopyOriginal = async () => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text.trim());
    } catch (_) {
      // ignore
    }
  };

  const handleDownload = (format) => {
    if (!result) return;
    if (format === "txt") {
      const blob = new Blob([result], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "simplified.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    const headerY = 52;
    let y = 96;

    doc.setFont("times", "bold");
    doc.setFontSize(20);
    doc.text("Academic Simplifier", margin, headerY);
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.text(new Date().toLocaleString(), margin, headerY + 18);
    doc.setDrawColor(220);
    doc.line(margin, headerY + 28, pageWidth - margin, headerY + 28);

    const addSection = (title, content) => {
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.text(title, margin, y);
      y += 16;
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(content || "-", contentWidth);
      for (const line of lines) {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 14;
      }
      y += 12;
    };

    addSection("Original", text.trim());
    addSection("Simplified", result);

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i += 1) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - margin,
        pageHeight - 24,
        { align: "right" }
      );
    }

    doc.save("simplified.pdf");
  };

  const handleShare = async () => {
    if (!result) return;
    const payload = {
      title: "Academic Simplifier",
      text: result,
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
      } else {
        await navigator.clipboard.writeText(result);
        setCopyStatus("copied");
        setTimeout(() => setCopyStatus("idle"), 1500);
      }
    } catch (_) {
      // ignore
    }
  };

  const handleHistorySelect = (entry) => {
    setText(entry.input);
    setResult(entry.output);
    setError("");
    setLatencyMs(null);
    setSummaryItems([]);
    setSummaryError("");
    setMeaningCheck(null);
    setMeaningError("");
  };

  const handleHistoryPin = (id) => {
    setHistory((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, pinned: !entry.pinned } : entry
      )
    );
  };

  const handleHistoryDelete = (id) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleHistoryRerun = (entry) => {
    setText(entry.input);
    setResult("");
    setError("");
    setLatencyMs(null);
    setSummaryItems([]);
    setSummaryError("");
    setMeaningCheck(null);
    setMeaningError("");
    setTimeout(() => handleSimplify(), 0);
  };

  const handleProCheck = async () => {
    if (!proEmail) return;
    localStorage.setItem("pro_email", proEmail);
    setProLoading(true);
    try {
      const res = await fetch("/api/pro-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: proEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Pro check failed");
      setProStatus(data);
      if (data.isPro) {
        setIsPro(true);
        localStorage.setItem("is_pro", "true");
      }
    } catch (error) {
      setProStatus({ error: error.message });
    } finally {
      setProLoading(false);
    }
  };

  const handleHistoryClear = () => {
    setHistory([]);
  };

  const handleQualityRetry = () => {
    if (model !== "quality") {
      setModel("quality");
    }
    setTimeout(() => handleSimplify(), 0);
  };

  const hasResult = Boolean(result);

  return (
    <div className={`${styles.page} ${display.variable} ${body.variable}`}>
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              <svg viewBox="0 0 48 48" role="img" aria-label="">
                <defs>
                  <linearGradient id="brandGradient" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ff6b4a" />
                    <stop offset="100%" stopColor="#f2542d" />
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#brandGradient)" />
                <path
                  d="M24 12l10 24h-4.6l-2.2-5.2H20.8L18.6 36H14l10-24zm1.8 14.6-3-7.6-3 7.6h6z"
                  fill="#fff"
                />
              </svg>
            </span>
            <div>
              <p className={styles.brandName}>Academic Simplifier</p>
              <p className={styles.brandTag}>B1 English in seconds</p>
            </div>
          </div>
          <a
            className={styles.proButton}
            href="https://cloudtools-pro.lemonsqueezy.com/checkout/buy/eb93c2ce-bf52-44f0-97ad-2100c2a956b1"
            target="_blank"
            rel="noopener noreferrer"
          >
            Upgrade to Pro
          </a>
        </header>

        <div className={styles.disclosureBar}>
          <span>Quality checks enabled</span>
          <span>Consistency-focused results</span>
        </div>

        <section className={styles.hero}>
          <div>
            <h1>Turn complex academic text into clear, readable English.</h1>
            <p>
              Fast, focused, and designed for comprehension. Paste your text,
              hit simplify, and share a clean B1 version immediately.
            </p>
            <div className={styles.heroActions}>
              <button
                className={styles.primaryButton}
                onClick={handleSimplify}
                disabled={loading || (!isPro && useCount >= 3) || !text.trim()}
              >
                {loading ? "Simplifying..." : "Simplify Now"}
              </button>
              <button className={styles.ghostButton} onClick={handleSample}>
                Use a sample
              </button>
            </div>
            <div className={styles.usageCard}>
              <div>
                <p className={styles.usageTitle}>Free usage</p>
                <p className={styles.usageValue}>
                  {isPro
                    ? "Unlimited (Pro)"
                    : `${remaining} of 3 simplifications left today`}
                </p>
              </div>
              <div className={styles.usageBar}>
                <span
                  style={{ width: `${isPro ? 100 : (remaining / 3) * 100}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
          <div className={styles.flow}>
            <div className={styles.flowStep}>
              <span>1</span>
              <div>
                <h3>Paste or type</h3>
                <p>Add your academic paragraph, abstract, or notes.</p>
              </div>
            </div>
            <div className={styles.flowStep}>
              <span>2</span>
              <div>
                <h3>Simplify instantly</h3>
                <p>We rewrite to B1 English while keeping meaning intact.</p>
              </div>
            </div>
            <div className={styles.flowStep}>
              <span>3</span>
              <div>
                <h3>Copy & share</h3>
                <p>Export clean text for students, teams, or readers.</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.workspace}>
          <div className={styles.inputHeader}>
            <div>
              <h2>Your input</h2>
              <p>Ideal for abstracts, notes, or research summaries.</p>
              <p className={styles.modelHint}>
                Fast = quickest response. Quality = more accurate rewrite.
              </p>
            </div>
            <div className={styles.inputActions}>
              <select
                className={styles.modelSelect}
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                <option value="fast">Fast model</option>
                <option value="quality">Quality model</option>
              </select>
              <button className={styles.secondaryButton} onClick={handleClear}>
                Clear
              </button>
              <button className={styles.secondaryButton} onClick={handleSample}>
                Paste sample
              </button>
            </div>
          </div>

          <div className={styles.protectedTerms}>
            <label htmlFor="protectedTerms">Korunacak terimler</label>
            <input
              id="protectedTerms"
              className={styles.protectedInput}
              placeholder="Örn: GDP, HIV, CRISPR (virgülle ayır)"
              value={protectedTerms}
              onChange={(e) => setProtectedTerms(e.target.value)}
            />
            <p>Bu terimler sadeleştirme sırasında aynen korunur.</p>
            {protectedTermList.length > 0 && (
              <div className={styles.termPills}>
                {protectedTermList.map((term) => (
                  <span key={term} className={styles.termPill}>
                    {term}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={styles.protectedTerms}>
            <label htmlFor="reductionTarget">Reduction hedefi</label>
            <div className={styles.reductionRow}>
              <input
                id="reductionTarget"
                type="range"
                min="0"
                max="70"
                step="5"
                value={reductionTarget}
                onChange={(e) => setReductionTarget(Number(e.target.value))}
                disabled={!isPro}
              />
              <span className={styles.reductionValue}>{reductionTarget}%</span>
              {!isPro && (
                <span className={styles.badgeMuted}>Pro</span>
              )}
            </div>
            <p>
              Çıktının ne kadar sadeleşeceğini hedefle. Pro’da aktif.
            </p>
            {!isPro && (
              <a
                className={styles.proLink}
                href="https://cloudtools-pro.lemonsqueezy.com/checkout/buy/eb93c2ce-bf52-44f0-97ad-2100c2a956b1"
                target="_blank"
                rel="noopener noreferrer"
              >
                Pro ile reduction ayarı aç
              </a>
            )}
          </div>

          <div className={styles.protectedTerms}>
            <label htmlFor="proEmail">Pro durumunu kontrol et</label>
            <div className={styles.reductionRow}>
              <input
                id="proEmail"
                type="email"
                className={styles.protectedInput}
                placeholder="Ödeme e-postan"
                value={proEmail}
                onChange={(e) => setProEmail(e.target.value)}
              />
              <button
                className={styles.secondaryButton}
                onClick={handleProCheck}
                disabled={proLoading || !proEmail}
              >
                {proLoading ? "Checking..." : "Check"}
              </button>
            </div>
            {proStatus?.isPro && <p>Pro aktif görünüyor.</p>}
            {proStatus?.error && (
              <p className={styles.summaryError}>{proStatus.error}</p>
            )}
          </div>

          <textarea
            className={styles.textarea}
            placeholder="Paste academic text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading || (!isPro && useCount >= 3)}
          />

          <div className={styles.inputMeta}>
            <span>{textStats.words} words</span>
            <span>{textStats.chars} characters</span>
            {latencyMs !== null && <span>{latencyMs} ms</span>}
          </div>

          <div className={styles.submitRow}>
            <button
              className={styles.primaryButton}
              onClick={handleSimplify}
              disabled={loading || (!isPro && useCount >= 3) || !text.trim()}
            >
              {loading ? "Simplifying..." : "Simplify"}
            </button>
            <label className={styles.compareToggle}>
              <input
                type="checkbox"
                checked={showCompare}
                onChange={(e) => setShowCompare(e.target.checked)}
              />
              Compare view
            </label>
            <div className={styles.submitHint}>
              {!isPro && useCount >= 3 ? (
                <span>Upgrade to continue without limits.</span>
              ) : (
                <span>Keep it short for the fastest response.</span>
              )}
            </div>
          </div>

          <div className={styles.shortcutHint}>
            <span>`Ctrl + Enter` to simplify</span>
            <span>`Esc` to clear</span>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {hasResult && showCompare && (
            <div className={styles.compareGrid}>
              <div className={styles.compareCard}>
                <div className={styles.resultHeader}>
                  <h3>Original</h3>
                  <span className={styles.badgeMuted}>Input</span>
                </div>
                <p>{text.trim()}</p>
                <div className={styles.resultActions}>
                  <button
                    className={styles.secondaryButton}
                    onClick={handleCopyOriginal}
                  >
                    Copy original
                  </button>
                </div>
              </div>
              <div className={styles.compareCard}>
                <div className={styles.resultHeader}>
                  <h3>Simplified</h3>
                  <button
                    className={styles.secondaryButton}
                    onClick={handleCopy}
                  >
                    {copyStatus === "copied"
                      ? "Copied"
                      : copyStatus === "failed"
                        ? "Copy failed"
                      : "Copy"}
                  </button>
                </div>
                <p>{result}</p>
                <div className={styles.resultActions}>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => handleDownload("txt")}
                  >
                    Download TXT
                  </button>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => handleDownload("pdf")}
                  >
                    Download PDF
                  </button>
                  <button className={styles.secondaryButton} onClick={handleShare}>
                    Share
                  </button>
                </div>
              </div>
            </div>
          )}

          {hasResult && !showCompare && (
            <div className={styles.resultCard}>
              <div className={styles.resultHeader}>
                <h3>Simplified result</h3>
                <button className={styles.secondaryButton} onClick={handleCopy}>
                  {copyStatus === "copied"
                    ? "Copied"
                    : copyStatus === "failed"
                      ? "Copy failed"
                      : "Copy"}
                </button>
              </div>
              <p>{result}</p>
              <div className={styles.resultActions}>
                <button
                  className={styles.secondaryButton}
                  onClick={() => handleDownload("txt")}
                >
                  Download TXT
                </button>
                <button
                  className={styles.secondaryButton}
                  onClick={() => handleDownload("pdf")}
                >
                  Download PDF
                </button>
                <button className={styles.secondaryButton} onClick={handleShare}>
                  Share
                </button>
              </div>
            </div>
          )}

          {hasResult && (
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <p>Output words</p>
                <strong>{outputStats.words}</strong>
              </div>
              <div className={styles.statCard}>
                <p>Estimated reading</p>
                <strong>{outputStats.minutes} min</strong>
              </div>
              <div className={styles.statCard}>
                <p>Reduction</p>
                <strong>{reductionPct}%</strong>
              </div>
            </div>
          )}

          {hasResult && (
            <div className={styles.summaryCard}>
              <div className={styles.resultHeader}>
                <h3>Visual summary</h3>
                <span className={styles.badgeMuted}>3-5 bullets</span>
              </div>
              {summaryLoading && <p>Generating summary...</p>}
              {summaryError && (
                <p className={styles.summaryError}>{summaryError}</p>
              )}
              {!summaryLoading && !summaryError && summaryItems.length > 0 && (
                <ul className={styles.summaryList}>
                  {summaryItems.slice(0, 5).map((item, index) => (
                    <li key={`${index}-${item}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {hasResult && (
            <div className={styles.summaryCard}>
              <div className={styles.resultHeader}>
                <h3>Meaning check</h3>
                <span className={styles.badgeMuted}>Auto</span>
              </div>
              {meaningLoading && <p>Checking meaning...</p>}
              {meaningError && (
                <p className={styles.summaryError}>{meaningError}</p>
              )}
              {!meaningLoading && !meaningError && meaningCheck && (
                <>
                  {meaningCheck.risk === "high" && (
                    <div className={styles.riskWarning}>
                      Meaning drift risk detected. Try Quality mode for a safer
                      rewrite.
                      <button
                        className={styles.secondaryButton}
                        onClick={handleQualityRetry}
                      >
                        Re-run with Quality
                      </button>
                    </div>
                  )}
                  <div className={styles.meaningGrid}>
                    <div>
                      <p>Match</p>
                      <strong>{meaningCheck.match ? "Yes" : "No"}</strong>
                    </div>
                    <div>
                      <p>Risk</p>
                      <strong
                        className={
                          meaningCheck.risk === "high"
                            ? styles.riskHigh
                            : meaningCheck.risk === "medium"
                              ? styles.riskMedium
                              : styles.riskLow
                        }
                      >
                        {meaningCheck.risk}
                      </strong>
                    </div>
                    <div>
                      <p>Notes</p>
                      <strong>{meaningCheck.notes}</strong>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {history.length > 0 && (
            <div className={styles.history}>
              <div className={styles.historyHeader}>
                <h3>Recent results</h3>
                <button
                  className={styles.secondaryButton}
                  onClick={handleHistoryClear}
                >
                  Clear history
                </button>
              </div>
              <div className={styles.historyList}>
                {sortedHistory.map((entry) => (
                  <div key={entry.id} className={styles.historyItem}>
                    <div>
                      <span>{new Date(entry.createdAt).toLocaleString()}</span>
                      <strong>{entry.output.slice(0, 80)}...</strong>
                    </div>
                    <div className={styles.historyActions}>
                      <button
                        className={styles.secondaryButton}
                        onClick={() => handleHistorySelect(entry)}
                      >
                        Use
                      </button>
                      <button
                        className={styles.secondaryButton}
                        onClick={() => handleHistoryPin(entry.id)}
                      >
                        {entry.pinned ? "Unpin" : "Pin"}
                      </button>
                      <button
                        className={styles.secondaryButton}
                        onClick={() => handleHistoryRerun(entry)}
                      >
                        Re-run
                      </button>
                      <button
                        className={styles.secondaryButton}
                        onClick={() => handleHistoryDelete(entry.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className={styles.proSection}>
          <div>
            <h2>Go Pro for unlimited simplifications</h2>
            <p>$4.99/month · 7-day free trial · Cancel anytime</p>
            <p>Pro ile: Reduction hedefi (çıktı kısalma oranı) ayarı</p>
          </div>
          <a
            className={styles.primaryButton}
            href="https://cloudtools-pro.lemonsqueezy.com/checkout/buy/eb93c2ce-bf52-44f0-97ad-2100c2a956b1"
            target="_blank"
            rel="noopener noreferrer"
          >
            Start free trial
          </a>
        </section>
      </main>
      <Analytics />
    </div>
  );
}

