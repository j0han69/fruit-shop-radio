import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import {
  LanguageCode,
  TranslationKey,
  translations,
} from '../config/translations';
import {
  ExtraTranslationKey,
  extraTranslations,
  RU_FALLBACK_LANGUAGES,
} from '../config/translationsExtra';

export type AnyTranslationKey = TranslationKey | ExtraTranslationKey;

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: AnyTranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isBaseKey(key: AnyTranslationKey): key is TranslationKey {
  return key in translations.ru;
}

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguage] = useState<LanguageCode>('ru');

  const t = useCallback(
    (key: AnyTranslationKey) => {
      if (isBaseKey(key)) return translations[language][key];
      const fallback = RU_FALLBACK_LANGUAGES.includes(language)
        ? extraTranslations.ru
        : extraTranslations.en;
      return extraTranslations[language]?.[key] ?? fallback[key];
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return context;
}
