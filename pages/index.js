import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSimplify = async () => {
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
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: "Arial", maxWidth: 800, margin: "0 auto" }}>
      <h1>📚 Understand any academic paper in seconds</h1>
      <p style={{ color: "#666" }}>Paste complex text and get a simple B1-level explanation</p>
      
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
        disabled={loading}
      />
      
      <br /><br />
      
      <button 
        onClick={handleSimplify}
        disabled={loading}
        style={{
          padding: "12px 24px",
          fontSize: 16,
          backgroundColor: loading ? "#ccc" : "#0070f3",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: loading ? "not-allowed" : "pointer"
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
          ❌ Error: {error}
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
    </div>
  );
}