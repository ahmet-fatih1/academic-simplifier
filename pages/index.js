import { useEffect, useMemo, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { Fraunces, Manrope } from "next/font/google";
import { jsPDF } from "jspdf";
import styles from "../styles/Home.module.css";
import Head from "next/head";
import personas from "../lib/personas";
import { extractTextFromPdf } from "../lib/pdf-parser";
import ChatPanel from "../components/ChatPanel";
import { useLanguage } from "../lib/LanguageContext";

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
  const { lang, toggleLanguage, t } = useLanguage();
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
  const [selectedPersona, setSelectedPersona] = useState("general");
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
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatStreaming, setChatStreaming] = useState(false);
  const [chatStreamText, setChatStreamText] = useState("");
  const [chatQuota, setChatQuota] = useState(10);
  const [darkMode, setDarkMode] = useState(false);
  const abortRef = useRef(null);
  const pdfInputRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem("is_pro");
    if (stored === "true") {
      setIsPro(true);
    }

    const savedEmail = localStorage.getItem("pro_email");
    if (savedEmail) {
      setProEmail(savedEmail);
    }

    const savedDark = localStorage.getItem("dark_mode");
    if (savedDark !== null) {
      setDarkMode(savedDark === "true");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setDarkMode(true);
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

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("dark_mode", String(next));
  };

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
    try {
      const stored = localStorage.getItem("chat_messages");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setChatMessages(parsed);
      }
      const quota = localStorage.getItem("chat_quota");
      if (quota !== null) setChatQuota(JSON.parse(quota));
    } catch (_) {}
  }, []);

  useEffect(() => {
    localStorage.setItem("chat_messages", JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem("chat_quota", JSON.stringify(chatQuota));
  }, [chatQuota]);

  useEffect(() => {
    const handleError = (event) => {
      console.error("Uncaught error:", event.error || event.message);
    };
    const handleRejection = (event) => {
      console.error("Unhandled promise rejection:", event.reason);
    };
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

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
      setError(t.errors.freeLimit);
      return;
    }

    if (!text.trim()) {
      setError(t.errors.emptyText);
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
          personaId: selectedPersona,
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
        throw new Error(data.error || t.errors.generic);
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
            pdfFileName: pdfFileName || "",
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
          throw new Error(summaryData.error || t.errors.summaryFailed);
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
    setPdfFileName("");
    setPdfError("");
    setChatOpen(false);
    setChatMessages([]);
    setChatStreamText("");
  };

  const handlePdfUpload = async (file) => {
    setPdfError("");
    setPdfLoading(true);
    try {
      const extracted = await extractTextFromPdf(file);
      setText(extracted);
      setPdfFileName(file.name);
    } catch (err) {
      setPdfError(err.message || t.errors.pdfFailed);
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePdfRemove = () => {
    setPdfFileName("");
    setPdfError("");
    setText("");
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handlePdfUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handlePdfUpload(file);
  };

  const handleChatToggle = () => {
    if (!chatOpen && chatMessages.length === 0) {
      setChatMessages([
        {
          role: "model",
          content: t.chat.welcome,
        },
      ]);
    }
    setChatOpen(!chatOpen);
  };

  const handleChatSend = async (msgText) => {
    if (!msgText || chatStreaming) return;
    if (!isPro && chatQuota <= 0) return;

    const userMsg = { role: "user", content: msgText };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatStreaming(true);
    setChatStreamText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: { original: text, simplified: result },
          model,
          personaId: selectedPersona,
          email: proEmail,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || t.errors.chatFailed);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) {
              fullText += data.text;
              setChatStreamText(fullText);
            }
            if (data.error) throw new Error(data.error);
          } catch (_) {}
        }
      }

      setChatMessages((prev) => [...prev, { role: "model", content: fullText }]);
      if (!isPro) setChatQuota((q) => Math.max(0, q - 1));
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "model", content: t.chat.error(err.message) },
      ]);
    } finally {
      setChatStreaming(false);
      setChatStreamText("");
    }
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
      if (!res.ok) throw new Error(data.error || t.errors.proFailed);
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
    <>
      <Head>
        <title>Simplify Academic Papers with AI | Simplify Academic</title>

        <meta
          name="description"
          content="Simplify complex academic papers into clear English while preserving technical terms. Free AI academic text simplifier."
        />

        <meta
          name="keywords"
          content="academic paper, simplify academic text, research paper summarizer, AI academic tool"
        />
        <meta
          name="google-site-verification"
          content="FwICLrj7I7T0K4oLso3MNY_7-ztr1EpxLVze5LBEHKM" />

        <link rel="canonical" href="https://simplify-academic.vercel.app" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://simplify-academic.vercel.app" />
        <meta property="og:title" content="Simplify Academic Papers with AI" />
        <meta
          property="og:description"
          content="Turn complex academic papers into clear, readable English. AI-powered simplification with persona-based output. Free to use."
        />
        <meta property="og:image" content="https://simplify-academic.vercel.app/og-image.svg" />
        <meta property="og:site_name" content="Academic Simplifier" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Simplify Academic Papers with AI" />
        <meta
          name="twitter:description"
          content="Turn complex academic papers into clear, readable English. AI-powered simplification with persona-based output. Free to use."
        />
        <meta name="twitter:image" content="https://simplify-academic.vercel.app/og-image.svg" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Academic Simplifier",
              url: "https://simplify-academic.vercel.app",
              description:
                "Simplify complex academic papers into clear English while preserving technical terms. AI-powered academic text simplifier.",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "AI-powered academic text simplification",
                "Multiple output personas (Student, Researcher, Business, Kid)",
                "Protected terminology support",
                "PDF and text export",
                "Meaning preservation check",
              ],
            }),
          }}
        />
      </Head>
      <div className={`${styles.page} ${display.variable} ${body.variable} ${darkMode ? styles.darkMode : ""}`}>
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
            <div className={styles.headerActions}>
              <button
                className={styles.darkModeToggle}
                onClick={toggleLanguage}
                aria-label={lang === "tr" ? "Switch to English" : "Türkçe'ye geç"}
              >
                {lang === "tr" ? "EN" : "TR"}
              </button>
              <button
                className={styles.darkModeToggle}
                onClick={toggleDarkMode}
                aria-label={darkMode ? t.header.darkMode : t.header.lightMode}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
              <a
                className={styles.proButton}
                href="https://cloudtools-pro.lemonsqueezy.com/checkout/buy/eb93c2ce-bf52-44f0-97ad-2100c2a956b1"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.header.upgrade}
              </a>
            </div>
          </header>

          <div className={styles.disclosureBar}>
            <span>{t.disclosure.quality}</span>
            <span>{t.disclosure.consistency}</span>
          </div>

          <section className={styles.hero}>
            <div>
              <h1>{t.hero.title}</h1>
              <p>{t.hero.description}</p>
              <div className={styles.heroActions}>
                <button
                  className={styles.primaryButton}
                  onClick={handleSimplify}
                  disabled={loading || (!isPro && useCount >= 3) || !text.trim()}
                >
                  {loading ? t.hero.ctaLoading : t.hero.cta}
                </button>
                <button className={styles.ghostButton} onClick={handleSample}>
                  {t.hero.sample}
                </button>
              </div>
              <div className={styles.usageCard}>
                <div>
                  <p className={styles.usageTitle}>{t.usage.title}</p>
                  <p className={styles.usageValue}>
                    {isPro ? t.usage.unlimited : t.usage.remaining(remaining)}
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
                  <h3>{t.flow.step1Title}</h3>
                  <p>{t.flow.step1Desc}</p>
                </div>
              </div>
              <div className={styles.flowStep}>
                <span>2</span>
                <div>
                  <h3>{t.flow.step2Title}</h3>
                  <p>{t.flow.step2Desc}</p>
                </div>
              </div>
              <div className={styles.flowStep}>
                <span>3</span>
                <div>
                  <h3>{t.flow.step3Title}</h3>
                  <p>{t.flow.step3Desc}</p>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>PDF</div>
              <h3>{t.features.pdf.title}</h3>
              <p>{t.features.pdf.desc}</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>5</div>
              <h3>{t.features.personas.title}</h3>
              <p>{t.features.personas.desc}</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>AI</div>
              <h3>{t.features.chat.title}</h3>
              <p>{t.features.chat.desc}</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>+</div>
              <h3>{t.features.terms.title}</h3>
              <p>{t.features.terms.desc}</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>%</div>
              <h3>{t.features.reduction.title}</h3>
              <p>{t.features.reduction.desc}</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>DL</div>
              <h3>{t.features.export.title}</h3>
              <p>{t.features.export.desc}</p>
            </div>
          </section>

          <section
            className={`${styles.workspace} ${chatOpen && hasResult ? styles.workspaceWithChat : ""}`}
          >
            <div className={`${styles.workspaceMain} ${hasResult ? styles.workspaceSplit : ""}`}>
              <div className={styles.inputPanel}>
              <div className={styles.inputHeader}>
                <div>
                <h2>{t.input.title}</h2>
                <p>{t.input.subtitle}</p>
                <p className={styles.modelHint}>
                  {t.input.modelHint}
                </p>
                <p className={styles.modelHint}>
                  {personas.find((p) => p.id === selectedPersona)?.description[lang]}
                </p>
              </div>
              <div className={styles.inputActions}>
                <select
                  className={styles.modelSelect}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  <option value="fast">{t.input.fastModel}</option>
                  <option value="quality">{t.input.qualityModel}</option>
                </select>
                <select
                  className={styles.modelSelect}
                  value={selectedPersona}
                  onChange={(e) => setSelectedPersona(e.target.value)}
                >
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label[lang]}
                    </option>
                  ))}
                </select>
                <button className={styles.secondaryButton} onClick={handleClear}>
                  {t.input.clear}
                </button>
                <button className={styles.secondaryButton} onClick={handleSample}>
                  {t.input.pasteSample}
                </button>
              </div>
            </div>

            <div className={styles.protectedTerms}>
              <label htmlFor="protectedTerms">{t.settings.protectedTerms}</label>
              <input
                id="protectedTerms"
                className={styles.protectedInput}
                placeholder={t.settings.protectedPlaceholder}
                value={protectedTerms}
                onChange={(e) => setProtectedTerms(e.target.value)}
              />
              <p>{t.settings.protectedHelp}</p>
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
              <label htmlFor="reductionTarget">{t.settings.reductionTarget}</label>
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
                  <span className={styles.badgeMuted}>{t.settings.protectedBadge}</span>
                )}
              </div>
              <p>{t.settings.reductionHelp}</p>
              {!isPro && (
                <a
                  className={styles.proLink}
                  href="https://cloudtools-pro.lemonsqueezy.com/checkout/buy/eb93c2ce-bf52-44f0-97ad-2100c2a956b1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.settings.reductionLink}
                </a>
              )}
            </div>

            <div className={styles.protectedTerms}>
              <label htmlFor="proEmail">{t.settings.proCheck}</label>
              <div className={styles.reductionRow}>
                <input
                  id="proEmail"
                  type="email"
                  className={styles.protectedInput}
                  placeholder={t.settings.proEmail}
                  value={proEmail}
                  onChange={(e) => setProEmail(e.target.value)}
                />
                <button
                  className={styles.secondaryButton}
                  onClick={handleProCheck}
                  disabled={proLoading || !proEmail}
                >
                  {proLoading ? t.settings.checking : t.settings.check}
                </button>
              </div>
              {proStatus?.isPro && <p>{t.settings.proActive}</p>}
              {proStatus?.error && (
                <p className={styles.summaryError}>{proStatus.error}</p>
              )}
            </div>

            <div
              className={`${styles.pdfDropzone} ${isDragging ? styles.pdfDropzoneActive : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf"
                className={styles.pdfFileInput}
                onChange={handleFileSelect}
              />

              <div className={styles.pdfUploadRow}>
                <button
                  className={styles.secondaryButton}
                  onClick={() => pdfInputRef.current?.click()}
                  disabled={pdfLoading || loading}
                >
                  {pdfLoading ? t.pdf.reading : t.pdf.upload}
                </button>

                {pdfFileName && (
                  <span className={styles.pdfBadge}>
                    {pdfFileName}
                    <button
                      className={styles.pdfBadgeRemove}
                      onClick={handlePdfRemove}
                    >
                      {t.pdf.remove}
                    </button>
                  </span>
                )}

                {pdfLoading && <span className={styles.pdfSpinner} />}
              </div>

              {pdfError && (
                <p className={styles.summaryError}>{pdfError}</p>
              )}
            </div>

            <textarea
              className={styles.textarea}
              placeholder={t.input.textareaPlaceholder}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading || (!isPro && useCount >= 3)}
            />

            <div className={styles.inputMeta}>
              <span>{t.input.words(textStats.words)}</span>
              <span>{t.input.chars(textStats.chars)}</span>
              {latencyMs !== null && <span>{t.input.latency(latencyMs)}</span>}
            </div>

            <div className={styles.submitRow}>
              <button
                className={styles.primaryButton}
                onClick={handleSimplify}
                disabled={loading || (!isPro && useCount >= 3) || !text.trim()}
              >
                {loading ? t.submit.simplifying : t.submit.simplify}
              </button>
              <label className={styles.compareToggle}>
                <input
                  type="checkbox"
                  checked={showCompare}
                  onChange={(e) => setShowCompare(e.target.checked)}
                />
                {t.submit.compareView}
              </label>
              <div className={styles.submitHint}>
                {!isPro && useCount >= 3 ? (
                  <span>{t.submit.limitHint}</span>
                ) : (
                  <span>{t.submit.usageHint}</span>
                )}
              </div>
            </div>

            <div className={styles.shortcutHint}>
              <span>{t.submit.shortcutSimplify}</span>
              <span>{t.submit.shortcutClear}</span>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            </div>

            {hasResult && (
              <div className={styles.outputPanel}>

            {hasResult && showCompare && (
              <div className={styles.compareGrid}>
                <div className={styles.compareCard}>
                  <div className={styles.resultHeader}>
                    <h3>{t.output.original}</h3>
                    <span className={styles.badgeMuted}>{t.output.inputBadge}</span>
                  </div>
                  <p>{text.trim()}</p>
                  <div className={styles.resultActions}>
                    <button
                      className={styles.secondaryButton}
                      onClick={handleCopyOriginal}
                    >
                      {t.output.copyOriginal}
                    </button>
                  </div>
                </div>
                <div className={styles.compareCard}>
                  <div className={styles.resultHeader}>
                    <h3>{t.output.simplified}</h3>
                    <button
                      className={styles.secondaryButton}
                      onClick={handleCopy}
                    >
                      {copyStatus === "copied"
                        ? t.output.copied
                        : copyStatus === "failed"
                          ? t.output.copyFailed
                          : t.output.copy}
                    </button>
                  </div>
                  <p>{result}</p>
                  <div className={styles.resultActions}>
                    <button
                      className={styles.secondaryButton}
                      onClick={() => handleDownload("txt")}
                    >
                      {t.output.downloadTxt}
                    </button>
                    <button
                      className={styles.secondaryButton}
                      onClick={() => handleDownload("pdf")}
                    >
                      {t.output.downloadPdf}
                    </button>
                    <button className={styles.secondaryButton} onClick={handleShare}>
                      {t.output.share}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {hasResult && !showCompare && (
              <div className={styles.resultCard}>
                <div className={styles.resultHeader}>
                  <h3>{t.output.resultTitle}</h3>
                  <button className={styles.secondaryButton} onClick={handleCopy}>
                    {copyStatus === "copied"
                      ? t.output.copied
                      : copyStatus === "failed"
                        ? t.output.copyFailed
                        : t.output.copy}
                  </button>
                </div>
                <p>{result}</p>
                <div className={styles.resultActions}>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => handleDownload("txt")}
                  >
                    {t.output.downloadTxt}
                  </button>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => handleDownload("pdf")}
                  >
                    {t.output.downloadPdf}
                  </button>
                  <button className={styles.secondaryButton} onClick={handleShare}>
                    {t.output.share}
                  </button>
                </div>
              </div>
            )}

            {hasResult && (
              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <p>{t.output.outputWords}</p>
                  <strong>{outputStats.words}</strong>
                </div>
                <div className={styles.statCard}>
                  <p>{t.output.estimatedReading}</p>
                  <strong>{t.output.min(outputStats.minutes)}</strong>
                </div>
                <div className={styles.statCard}>
                  <p>{t.output.reduction}</p>
                  <strong>{reductionPct}%</strong>
                </div>
              </div>
            )}

            {hasResult && (
              <div className={styles.summaryCard}>
                <div className={styles.resultHeader}>
                  <h3>{t.summary.title}</h3>
                  <span className={styles.badgeMuted}>{t.summary.badge}</span>
                </div>
                {summaryLoading && <p>{t.summary.generating}</p>}
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
                  <h3>{t.meaning.title}</h3>
                  <span className={styles.badgeMuted}>{t.meaning.badge}</span>
                </div>
                {meaningLoading && <p>{t.meaning.checking}</p>}
                {meaningError && (
                  <p className={styles.summaryError}>{meaningError}</p>
                )}
                {!meaningLoading && !meaningError && meaningCheck && (
                  <>
                    {meaningCheck.risk === "high" && (
                      <div className={styles.riskWarning}>
                        {t.meaning.riskWarning}
                        <button
                          className={styles.secondaryButton}
                          onClick={handleQualityRetry}
                        >
                          {t.meaning.rerun}
                        </button>
                      </div>
                    )}
                    <div className={styles.meaningGrid}>
                      <div>
                        <p>{t.meaning.match}</p>
                        <strong>{meaningCheck.match ? t.meaning.yes : t.meaning.no}</strong>
                      </div>
                      <div>
                        <p>{t.meaning.risk}</p>
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
                        <p>{t.meaning.notes}</p>
                        <strong>{meaningCheck.notes}</strong>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {hasResult && (
              <button
                className={styles.chatToggleButton}
                onClick={handleChatToggle}
              >
                {chatOpen ? t.chat.toggleClose : t.chat.toggleOpen}
              </button>
            )}
            </div>
            )}

            {history.length > 0 && (
              <div className={styles.history}>
                <div className={styles.historyHeader}>
                  <h3>{t.history.title}</h3>
                  <button
                    className={styles.secondaryButton}
                    onClick={handleHistoryClear}
                  >
                    {t.history.clear}
                  </button>
                </div>
                <div className={styles.historyList}>
                  {sortedHistory.map((entry) => (
                    <div key={entry.id} className={styles.historyItem}>
                      <div>
                        <span>{new Date(entry.createdAt).toLocaleString()}</span>
                        {entry.pdfFileName && (
                          <span className={styles.pdfBadge} style={{ marginLeft: 8 }}>
                            {entry.pdfFileName}
                          </span>
                        )}
                        <strong>{entry.output.slice(0, 80)}...</strong>
                      </div>
                      <div className={styles.historyActions}>
                        <button
                          className={styles.secondaryButton}
                          onClick={() => handleHistorySelect(entry)}
                        >
                          {t.history.use}
                        </button>
                        <button
                          className={styles.secondaryButton}
                          onClick={() => handleHistoryPin(entry.id)}
                        >
                          {entry.pinned ? t.history.unpin : t.history.pin}
                        </button>
                        <button
                          className={styles.secondaryButton}
                          onClick={() => handleHistoryRerun(entry)}
                        >
                          {t.history.rerun}
                        </button>
                        <button
                          className={styles.secondaryButton}
                          onClick={() => handleHistoryDelete(entry.id)}
                        >
                          {t.history.delete}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>

            {hasResult && chatOpen && (
              <ChatPanel
                isOpen={chatOpen}
                onToggle={handleChatToggle}
                messages={chatMessages}
                onSend={handleChatSend}
                streaming={chatStreaming}
                streamingText={chatStreamText}
                remainingQuota={chatQuota}
                isPro={isPro}
                t={t.chat}
              />
            )}
          </section>

          <section className={styles.proSection}>
            <div>
              <h2>{t.pro.title}</h2>
              <p>{t.pro.price}</p>
              <p>{t.pro.feature}</p>
            </div>
            <a
              className={styles.primaryButton}
              href="https://cloudtools-pro.lemonsqueezy.com/checkout/buy/eb93c2ce-bf52-44f0-97ad-2100c2a956b1"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.pro.cta}
            </a>
          </section>
        </main>
        <Analytics />
      </div> </>
  );
}

