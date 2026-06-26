// Kuwait conventions: KWD with 3 decimal places, Friday–Saturday weekend.
// Arabic-Indic numerals by default with an optional Latin toggle.

export function formatMoney(amount: number, latn = false): string {
  const locale = latn ? 'ar-KW-u-nu-latn' : 'ar-KW'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'KWD',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function formatNumber(n: number, latn = false): string {
  const locale = latn ? 'en' : 'ar-KW'
  return new Intl.NumberFormat(locale).format(Number.isFinite(n) ? n : 0)
}

export function formatDate(d: string | Date | null | undefined, latn = false): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat(latn ? 'en-GB' : 'ar-KW', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
