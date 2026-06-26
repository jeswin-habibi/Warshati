import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import ar from '@/locales/ar.json'
import en from '@/locales/en.json'

export const LANGS = {
  en: { label: 'English', dir: 'ltr' as const },
  ar: { label: 'العربية', dir: 'rtl' as const },
}
export type Lang = keyof typeof LANGS

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { ar: { translation: ar }, en: { translation: en } },
    // English is the default; Arabic is used only when the user explicitly selects it.
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage'], caches: ['localStorage'] },
  })

/** Keep <html lang/dir> in sync with the active language (RTL only for Arabic). */
export function applyDir(lng: string) {
  const dir = LANGS[lng as Lang]?.dir ?? 'ltr'
  document.documentElement.lang = lng
  document.documentElement.dir = dir
}
applyDir(i18n.language || 'en')
i18n.on('languageChanged', applyDir)

export default i18n
