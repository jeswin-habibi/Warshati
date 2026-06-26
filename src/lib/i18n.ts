import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import ar from '@/locales/ar.json'
import en from '@/locales/en.json'

export const LANGS = {
  ar: { label: 'العربية', dir: 'rtl' as const },
  en: { label: 'English', dir: 'ltr' as const },
}
export type Lang = keyof typeof LANGS

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { ar: { translation: ar }, en: { translation: en } },
    fallbackLng: 'ar',
    supportedLngs: ['ar', 'en'],
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  })

/** Keep <html lang/dir> in sync with the active language (Arabic = RTL by default). */
export function applyDir(lng: string) {
  const dir = LANGS[lng as Lang]?.dir ?? 'rtl'
  document.documentElement.lang = lng
  document.documentElement.dir = dir
}
applyDir(i18n.language || 'ar')
i18n.on('languageChanged', applyDir)

export default i18n
