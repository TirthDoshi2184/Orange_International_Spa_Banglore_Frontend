import { useLanguage } from "../../context/LanguageContext";

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex gap-1 border border-gray-200 rounded-lg p-0.5 text-xs">
      <button
        onClick={() => setLanguage("en")}
        className={`px-2.5 py-1 rounded-md ${language === "en" ? "bg-orange-500 text-white" : "text-gray-600"}`}
      >
        English
      </button>
      <button
        onClick={() => setLanguage("kn")}
        className={`px-2.5 py-1 rounded-md ${language === "kn" ? "bg-orange-500 text-white" : "text-gray-600"}`}
      >
        ಕನ್ನಡ
      </button>
    </div>
  );
};

export default LanguageSwitcher;