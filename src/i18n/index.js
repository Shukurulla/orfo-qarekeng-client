// src/i18n/index.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Tillar
import karakalpakTranslations from "./locales/kaa.json";
import uzbekTranslations from "./locales/uz.json";

// i18n konfiguratsiyasi
i18n
  .use(LanguageDetector) // Brauzerdagi tilni avtomatik aniqlash
  .use(initReactI18next) // React uchun i18next-ni ishga tushirish
  .init({
    resources: {
      kaa: {
        translation: karakalpakTranslations,
      },
      uz: {
        translation: uzbekTranslations,
      },
    },
    fallbackLng: "kaa", // Standart til
    debug: process.env.NODE_ENV === "development",

    interpolation: {
      escapeValue: false, // React o'zi XSS ni oldini oladi
    },

    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "userLanguage",
      caches: ["localStorage"],
    },
  });

export default i18n;
