import Head from "next/head";

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service | Simplify Academic</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div
        className="errorBoundary"
        style={{ textAlign: "left", alignItems: "flex-start", maxWidth: 640, margin: "0 auto" }}
      >
        <h2>Terms of Service</h2>
        <p>
          <strong>Last updated:</strong> July 23, 2026
        </p>

        <h3>1. Acceptance</h3>
        <p>
          By using Simplify Academic, you agree to these terms. If you do not agree, please do not
          use the service.
        </p>

        <h3>2. Description of Service</h3>
        <p>
          Simplify Academic is an AI-powered tool that rewrites complex academic text into
          simpler, more readable English. It is provided as-is for educational purposes.
        </p>

        <h3>3. Free Tier</h3>
        <p>
          Free users can perform up to 5 simplifications per day and send up to 10 chat messages per
          day. These limits are tracked by IP address or email.
        </p>

        <h3>4. Pro Subscription</h3>
        <p>
          Pro subscriptions are processed through LemonSqueezy. You can cancel at any time. Refunds
          are handled according to LemonSqueezy&apos;s refund policy.
        </p>

        <h3>5. Accuracy</h3>
        <p>
          AI-generated simplifications may contain errors. Always verify important information
          against the original text. We do not guarantee complete accuracy.
        </p>

        <h3>6. Limitation of Liability</h3>
        <p>
          Simplify Academic is provided without warranties. We are not liable for any damages
          arising from the use of this service.
        </p>

        <h3>7. Contact</h3>
        <p>
          For questions about these terms, contact us at{" "}
          <a href="mailto:ahmet@example.com">ahmet@example.com</a>.
        </p>

        <button className="errorBoundaryBtn" onClick={() => (window.location.href = "/")}>
          Go Home
        </button>
      </div>
    </>
  );
}
