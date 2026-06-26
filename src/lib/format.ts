// Kuwait conventions: KWD with 3 decimal places. Numerals follow the active language —
// Arabic → Arabic-Indic + د.ك, English → Latin digits + KWD.
import i18n from '@/lib/i18n'

const isEn = () => (i18n.language || 'en').startsWith('en')

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat(isEn() ? 'en-KW' : 'ar-KW', {
    style: 'currency',
    currency: 'KWD',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat(isEn() ? 'en' : 'ar-KW').format(Number.isFinite(n) ? n : 0)
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat(isEn() ? 'en-GB' : 'ar-KW', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
