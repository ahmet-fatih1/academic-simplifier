import { createContext, useContext, useState, useEffect } from "react";
import tr from "./locales/tr";
import en from "./locales/en";

const locales = { tr, en };
const LanguageContext = createContext();

function getInitialLang() {
  if (typeof window === "undefined") return "tr";
  const saved = localStorage.getItem("language");
  if (saved && locales[saved]) return saved;
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "tr";
  return "tr";
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);

  const toggleLanguage = () => {
    const next = lang === "tr" ? "en" : "tr";
    setLang(next);
    localStorage.setItem("language", next);
  };

  const t = locales[lang];

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
