import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import tr from "./locales/tr";
import en from "./locales/en";

const locales = { tr, en };
const LanguageContext = createContext();

function getInitialLang() {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem("language");
  if (saved && locales[saved]) return saved;
  if (navigator.language.startsWith("tr")) return "tr";
  return "en";
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);

  const toggleLanguage = useCallback(() => {
    setLang((prev) => {
      const next = prev === "tr" ? "en" : "tr";
      localStorage.setItem("language", next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ lang, toggleLanguage, t: locales[lang] }),
    [lang, toggleLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
