import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useCount, setUseCount] = useState(0);

  const handleSimplify = async () => {
    // Free kullanım limiti kontrolü
    if (useCount >= 3) {
      setError("You've reached your free limit! Upgrade to Pro for unlimited use.");
      return;
    }

    if (!text.trim()) {
      setError("Please enter some text first!");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");

    try {
      const res = await fetch("/api/simplify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setResult(data.result);
      setUseCount(useCount + 1);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: "Arial", maxWidth: 800, margin: "0 auto" }}>
      {/* Header with Subscribe Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>📚 Academic Text Simplifier</h1>
        <a 
          href="https://cloudtools-pro.lemonsqueezy.com/checkout/buy/eb93c2ce-bf52-44f0-97ad-2100c2a956b1"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "10px 20px",
            backgroundColor: "#FFD700",
            color: "#000",
            textDecoration: "none",
            borderRadius: 8,
            fontWeight: "bold",
            fontSize: 14
          }}
        >
          ⚡ Upgrade to Pro
        </a>
      </div>

      <p style={{ color: "#666" }}>
        Simplify complex academic texts to B1 level English in seconds using AI.
      </p>
      
      {/* Free Usage Counter */}
      <div style={{ 
        padding: 10, 
        backgroundColor: useCount >= 3 ? "#fee" : "#f0f9ff", 
        borderRadius: 8, 
        marginBottom: 20,
        textAlign: "center"
      }}>
        {useCount < 3 ? (
          <span>✨ <strong>{3 - useCount}</strong> free simplifications remaining today</span>
        ) : (
          <span>🚀 <strong>Upgrade to Pro</strong> for unlimited simplifications!</span>
        )}
      </div>
      
      <textarea
        style={{ 
          width: "100%", 
          height: 150, 
          padding: 10, 
          fontSize: 14,
          border: "2px solid #ddd",
          borderRadius: 8
        }}
        placeholder="Paste academic text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading || useCount >= 3}
      />
      
      <br /><br />
      
      <button 
        onClick={handleSimplify}
        disabled={loading || useCount >= 3}
        style={{
          padding: "12px 24px",
          fontSize: 16,
          backgroundColor: (loading || useCount >= 3) ? "#ccc" : "#0070f3",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: (loading || useCount >= 3) ? "not-allowed" : "pointer"
        }}
      >
        {loading ? "⏳ Simplifying..." : "✨ Simplify"}
      </button>

      {error && (
        <div style={{ 
          marginTop: 20, 
          padding: 15, 
          backgroundColor: "#fee", 
          color: "#c00",
          borderRadius: 8 
        }}>
          ❌ {error}
          {useCount >= 3 && (
            <div style={{ marginTop: 10 }}>
              <a 
                href="https://cloudtools-pro.lemonsqueezy.com/checkout/buy/eb93c2ce-bf52-44f0-97ad-2100c2a956b1"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: 10,
                  padding: "10px 20px",
                  backgroundColor: "#FFD700",
                  color: "#000",
                  textDecoration: "none",
                  borderRadius: 8,
                  fontWeight: "bold"
                }}
              >
                🚀 Get Pro - $4.99/month (7-day free trial)
              </a>
            </div>
          )}
        </div>
      )}

      {result && (
        <div style={{ 
          marginTop: 30, 
          padding: 20,
          backgroundColor: "#f0f9ff",
          borderRadius: 8,
          whiteSpace: "pre-wrap",
          lineHeight: 1.6
        }}>
          <h3 style={{ marginTop: 0 }}>✅ Simplified Version:</h3>
          {result}
        </div>
      )}

      {/* Features Section */}
      <div style={{ 
        marginTop: 60, 
        padding: 30, 
        backgroundColor: "#f9f9f9", 
        borderRadius: 8,
        textAlign: "center" 
      }}>
        <h2>🚀 Upgrade to Pro</h2>
        <p style={{ fontSize: 18, color: "#666" }}>
          <strong>$4.99/month</strong> · 7-day free trial
        </p>
        <ul style={{ 
          listStyle: "none", 
          padding: 0, 
          fontSize: 16,
          lineHeight: 2 
        }}>
          <li>✅ <strong>Unlimited</strong> simplifications</li>
          <li>✅ No daily limits</li>
          <li>✅ Priority support</li>
          <li>✅ Cancel anytime</li>
        </ul>
        <a 
          href="https://cloudtools-pro.lemonsqueezy.com/checkout/buy/eb93c2ce-bf52-44f0-97ad-2100c2a956b1"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            marginTop: 20,
            padding: "15px 40px",
            backgroundColor: "#0070f3",
            color: "white",
            textDecoration: "none",
            borderRadius: 8,
            fontWeight: "bold",
            fontSize: 18
          }}
        >
          Start Free Trial
        </a>
      </div>
    </div>
  );
}