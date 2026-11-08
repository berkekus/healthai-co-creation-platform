import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import tr from './locales/tr.json'
import pt from './locales/pt.json'
import es from './locales/es.json'
import nl from './locales/nl.json'

/** Where the chosen language is kept; it is read first on every page load. */
export const LANGUAGE_STORAGE_KEY = 'healthai_lang'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      tr: { translation: tr },
      pt: { translation: pt },
      es: { translation: es },
      nl: { translation: nl },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'tr', 'pt', 'es', 'nl'],
    nonExplicitSupportedLngs: true,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
