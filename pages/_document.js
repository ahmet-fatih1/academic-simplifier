import { Html, Head, Main, NextScript } from "next/document";

const DARK_MODE_SCRIPT = `
(function() {
  try {
    var saved = localStorage.getItem("dark_mode");
    var isDark = saved === "true" || (saved === null && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) document.documentElement.classList.add("darkMode");
  } catch(e) {}
})();
`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: DARK_MODE_SCRIPT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
