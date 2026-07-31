import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import kn from "./locales/kn.json";

const STORAGE_KEY = "orange_spa_language";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    kn: { translation: kn },
  },
  lng: localStorage.getItem(STORAGE_KEY) || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export const changeLanguage = (lang) => {
  i18n.changeLanguage(lang);
  localStorage.setItem(STORAGE_KEY, lang);
};

export default i18n;