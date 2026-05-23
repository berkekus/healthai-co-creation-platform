import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import tr from './locales/tr.json'
import pt from './locales/pt.json'
import es from './locales/es.json'
import nl from './locales/nl.json'

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
      lookupLocalStorage: 'healthai_lang',
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
