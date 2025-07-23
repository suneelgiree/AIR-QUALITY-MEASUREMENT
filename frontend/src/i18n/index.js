import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './en.json';
import np from './np.json';
import hi from './hi.json';

i18n
  .use(LanguageDetector) // optional: detects browser language
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      np: { translation: np },
      hi: { translation: hi },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safe from XSS
    },
  });

export default i18n;
