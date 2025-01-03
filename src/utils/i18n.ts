// mdu/src/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslation from "../locales/en.json";
import thTranslation from "../locales/th.json";
import idTranslation from "../locales/id.json";
import jpTranslation from "../locales/jp.json";

// Get stored language or default to browser language
const storedLanguage =
  localStorage.getItem("language") ||
  (navigator.language.startsWith("th")
    ? "th"
    : navigator.language.startsWith("id")
      ? "id"
      : "en");

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslation },
    th: { translation: thTranslation },
    id: { translation: idTranslation },
    jp: { translation: jpTranslation },
  },
  lng: storedLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

// Store language selection when it changes
i18n.on("languageChanged", (lng) => {
  localStorage.setItem("language", lng);
});

export default i18n;
