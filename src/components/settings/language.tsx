// mdu/src/components/settings/language.tsx

import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import FlagIcon from 'react-flagkit';

function LanguageSettings() {
  const { t, i18n } = useTranslation();

  const languages = [
    { 
      code: "en", 
      name: "English", 
      nativeName: "English", 
      country: "GB" 
    },
    { 
      code: "th", 
      name: "Thai", 
      nativeName: "ไทย", 
      country: "TH" 
    },
    { 
      code: "id", 
      name: "Indonesian", 
      nativeName: "Bahasa Indonesia", 
      country: "ID" 
    },
    {
      "code": "jp",
      "name": "Japanese",
      "nativeName": "日本語",
      "country": "JP"
    }
  ];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-gray-200 mb-6">
        {t("settings.tabs.language")}
      </h2>

      <div className="space-y-2">
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-md
                ${i18n.language === language.code
                  ? "bg-[#2d2d2d] text-blue-400"
                  : "text-gray-300 hover:bg-[#2d2d2d]/50"
              }`}
          >
            <div className="flex items-center space-x-3">
              <FlagIcon 
                country={language.country} 
                className="w-5 h-5 rounded"
              />
              <span className={`text-sm ${
                language.code === 'th' ? 'font-thai' : ''
              }`}>
                {language.nativeName}
              </span>
              <span className="text-xs text-gray-400">({language.name})</span>
            </div>
            {i18n.language === language.code && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </div>
  );
}

export default LanguageSettings;