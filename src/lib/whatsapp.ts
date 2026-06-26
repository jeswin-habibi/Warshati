// Build a wa.me link (normalizes Kuwait 8-digit numbers to +965). Works on web + mobile;
// no WhatsApp Business API needed for 1:1 messages.
export function waLink(phone: string | null | undefined, text: string): string {
  const raw = (phone ?? '').replace(/\D/g, '')
  const num = raw ? (raw.length === 8 ? `965${raw}` : raw) : ''
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`
}
