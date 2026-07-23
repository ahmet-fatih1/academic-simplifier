import ErrorBoundary from "../components/ErrorBoundary";
import { LanguageProvider } from "../lib/LanguageContext";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <Component {...pageProps} />
      </LanguageProvider>
    </ErrorBoundary>
  );
}
