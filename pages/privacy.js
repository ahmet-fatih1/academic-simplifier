import Head from "next/head";

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | Simplify Academic</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div
        className="errorBoundary"
        style={{ textAlign: "left", alignItems: "flex-start", maxWidth: 640, margin: "0 auto" }}
      >
        <h2>Privacy Policy</h2>
        <p>
          <strong>Last updated:</strong> July 23, 2026
        </p>

        <h3>1. Information We Collect</h3>
        <p>
          Simplify Academic processes the text you paste or upload for simplification purposes
          only. Your text is processed in memory and is never stored on our servers after the
          response is sent.
        </p>

        <h3>2. How We Use Your Information</h3>
        <p>
          We use your text solely to generate simplified versions via the Google Gemini API. We do
          not use your text for training, marketing, or any other purpose.
        </p>

        <h3>3. Data Storage</h3>
        <p>
          We store only your email address (if you provide it for Pro subscription verification) and
          usage limits (IP-based or email-based daily counts). No text content is persisted.
        </p>

        <h3>4. Third-Party Services</h3>
        <p>
          We use Google Gemini API for text simplification, LemonSqueezy for payment processing, and
          Vercel for hosting. Each service has its own privacy policy.
        </p>

        <h3>5. Cookies</h3>
        <p>
          We use localStorage to remember your preferences (language, dark mode, history). No
          tracking cookies are used.
        </p>

        <button className="errorBoundaryBtn" onClick={() => (window.location.href = "/")}>
          Go Home
        </button>
      </div>
    </>
  );
}
