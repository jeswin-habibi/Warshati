import i18n from '@/lib/i18n'

/** Pick the name for the active language. In English show the English value (fallback to the
 *  primary); in Arabic show the primary (fallback to English). Re-evaluated on each render, so
 *  components that use react-i18next update automatically when the language changes. */
export function locName(primary?: string | null, secondary?: string | null): string {
  const en = (i18n.language || 'en').startsWith('en')
  return (en ? secondary || primary : primary || secondary) || ''
}
