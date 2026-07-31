import { createContext, useContext } from "react";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../i18n";

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();

  const value = {
    language: i18n.language,
    setLanguage: changeLanguage,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};