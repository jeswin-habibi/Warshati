import { useRef, useState, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Printer, Share2, ArrowLeft } from 'lucide-react'
import { useBusiness } from '@/features/businesses/useBusiness'
import { useJob, useJobLineItems, useInvoiceForJob } from './api'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { formatMoney, formatDate } from '@/lib/format'
import { locName } from '@/lib/loc'
import i18n from '@/lib/i18n'

const ACCENT = '#4f46e5'
const MUTED = '#64748b'
const LABEL = '#94a3b8'
const INK = '#0f172a'

export default function InvoicePage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { id } = useParams()
  const { data: business } = useBusiness()
  const { data: job, isLoading } = useJob(id)
  const { data: lines } = useJobLineItems(id)
  const { data: invoice } = useInvoiceForJob(id)
  const sheetRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!job) return <div className="py-16 text-center text-muted-foreground">—</div>

  const rtl = i18n.dir() === 'rtl'
  const isInvoice = !!invoice
  const items = lines ?? []
  const subtotal = invoice?.subtotal ?? items.reduce((s, l) => s + Number(l.total || 0), 0)
  const discount = Number(invoice?.discount ?? 0)
  const total = Number(invoice?.total ?? subtotal)
  const balance = Number(invoice?.balance ?? 0)
  const paid = total - balance
  const docNo = invoice?.invoice_number ?? ''
  const dateStr = formatDate(invoice?.issued_at ?? job.completed_at ?? job.created_at)
  const fileName = `${isInvoice ? 'Invoice' : 'Estimate'}-${docNo || job.id.slice(0, 8)}`
  const vehicleLine = job.vehicle
    ? job.vehicle.plate_number || [job.vehicle.make, job.vehicle.model].filter(Boolean).join(' ')
    : ''
  const vehicleSub = job.vehicle?.plate_number ? [job.vehicle.make, job.vehicle.model].filter(Boolean).join(' ') : ''

  async function sharePdf() {
    const node = sheetRef.current
    if (!node) return
    setBusy(true)
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
      const pw = pdf.internal.pageSize.getWidth()
      const ph = pdf.internal.pageSize.getHeight()
      const imgH = (canvas.height * pw) / canvas.width
      const img = canvas.toDataURL('image/jpeg', 0.95)
      let heightLeft = imgH
      let position = 0
      pdf.addImage(img, 'JPEG', 0, position, pw, imgH)
      heightLeft -= ph
      while (heightLeft > 0) {
        position -= ph
        pdf.addPage()
        pdf.addImage(img, 'JPEG', 0, position, pw, imgH)
        heightLeft -= ph
      }
      const blob = pdf.output('blob')
      const file = new File([blob], `${fileName}.pdf`, { type: 'application/pdf' })
      const navAny = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean }
      if (navAny.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName } as ShareData)
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${fileName}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      }
    } finally {
      setBusy(false)
    }
  }

  const th: CSSProperties = { padding: '9px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }
  const thEnd: CSSProperties = { ...th, textAlign: 'end' }
  const td: CSSProperties = { padding: '9px 10px', verticalAlign: 'top' }
  const tdEnd: CSSProperties = { ...td, textAlign: 'end', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }
  const cap: CSSProperties = { fontSize: 11, textTransform: 'uppercase', color: LABEL, fontWeight: 700, letterSpacing: 0.4 }

  return (
    <div className="space-y-4 pb-4">
      <div className="no-print flex items-center gap-2">
        <button type="button" onClick={() => nav(-1)} aria-label={t('common.back')} className="tap flex items-center justify-center rounded-xl p-2 text-muted-foreground">
          <ArrowLeft className={`h-5 w-5 ${rtl ? 'rotate-180' : ''}`} />
        </button>
        <div className="flex-1" />
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer className="h-5 w-5" />
          {t('invoice.print')}
        </Button>
        <Button onClick={sharePdf} disabled={busy}>
          <Share2 className="h-5 w-5" />
          {busy ? '…' : t('invoice.share')}
        </Button>
      </div>

      <div className="invoice-scroll overflow-x-auto">
        <div
          ref={sheetRef}
          dir={rtl ? 'rtl' : 'ltr'}
          className="invoice-sheet"
          style={{ width: 794, margin: '0 auto', background: '#fff', color: INK, padding: 40, fontSize: 13, lineHeight: 1.5, boxShadow: '0 1px 10px rgba(15,23,42,0.14)', borderRadius: 4 }}
        >
          {/* header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {business?.logo_url ? (
                <img src={business.logo_url} crossOrigin="anonymous" alt="" style={{ height: 56, width: 56, objectFit: 'contain', borderRadius: 12 }} />
              ) : (
                <div style={{ height: 56, width: 56, borderRadius: 12, background: ACCENT, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800 }}>
                  {(business?.name || 'W').slice(0, 1)}
                </div>
              )}
              <div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{business?.name}</div>
                {business?.address && <div style={{ color: MUTED, fontSize: 12, maxWidth: 280 }}>{business.address}</div>}
              </div>
            </div>
            <div style={{ textAlign: 'end' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: ACCENT, letterSpacing: 1 }}>{isInvoice ? t('invoice.invoice') : t('invoice.estimate')}</div>
              {docNo && <div style={{ color: MUTED }} dir="ltr">{docNo}</div>}
              <div style={{ color: MUTED }}>{dateStr}</div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: `2px solid ${ACCENT}`, margin: '18px 0' }} />

          {/* parties */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
            <div>
              <div style={cap}>{t('invoice.billTo')}</div>
              <div style={{ fontWeight: 700, marginTop: 3 }}>{locName(job.customer?.name, job.customer?.name_en) || t('jobs.walkIn')}</div>
              {job.customer?.phone && <div style={{ color: MUTED }} dir="ltr">{job.customer.phone}</div>}
            </div>
            {(vehicleLine || job.mileage_at_visit != null) && (
              <div style={{ textAlign: 'end' }}>
                <div style={cap}>{t('invoice.vehicle')}</div>
                {vehicleLine && <div style={{ fontWeight: 700, marginTop: 3 }} dir="ltr">{vehicleLine}</div>}
                {vehicleSub && <div style={{ color: MUTED }} dir="ltr">{vehicleSub}</div>}
                {job.mileage_at_visit != null && <div style={{ color: MUTED }}>{t('invoice.mileage')}: {job.mileage_at_visit}</div>}
              </div>
            )}
          </div>

          {/* line items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
            <thead>
              <tr style={{ background: ACCENT, color: '#fff' }}>
                <th style={{ ...th, width: 32, textAlign: 'center' }}>#</th>
                <th style={{ ...th, textAlign: 'start' }}>{t('jobs.description')}</th>
                <th style={{ ...thEnd, width: 50 }}>{t('jobs.qty')}</th>
                <th style={{ ...thEnd, width: 110 }}>{t('jobs.price')}</th>
                <th style={{ ...thEnd, width: 120 }}>{t('jobs.total')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l, i) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ ...td, textAlign: 'center', color: MUTED }}>{i + 1}</td>
                  <td style={{ ...td, textAlign: 'start' }}>{l.description}</td>
                  <td style={tdEnd}>{l.quantity}</td>
                  <td style={tdEnd}>{formatMoney(l.unit_price)}</td>
                  <td style={{ ...tdEnd, fontWeight: 700 }}>{formatMoney(l.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
            <div style={{ width: 300 }}>
              <TotalRow label={t('invoice.subtotal')} value={formatMoney(subtotal)} />
              {discount > 0 && <TotalRow label={t('invoice.discount')} value={`- ${formatMoney(discount)}`} />}
              <div style={{ borderTop: '2px solid #e5e7eb', marginTop: 4 }}>
                <TotalRow label={t('jobs.total')} value={formatMoney(total)} bold />
              </div>
              {isInvoice && <TotalRow label={t('invoice.paid')} value={formatMoney(paid)} color={MUTED} />}
              {isInvoice && balance > 0 && (
                <div style={{ background: '#fef2f2', borderRadius: 8, marginTop: 6, padding: '2px 10px' }}>
                  <TotalRow label={t('invoice.balanceDue')} value={formatMoney(balance)} bold color="#dc2626" />
                </div>
              )}
            </div>
          </div>

          {/* footer */}
          <div style={{ marginTop: 30, paddingTop: 14, borderTop: '1px solid #e5e7eb', color: MUTED, fontSize: 12, textAlign: 'center' }}>
            {t('invoice.thanks')}
            {business?.name ? ` — ${business.name}` : ''}
          </div>
        </div>
      </div>
    </div>
  )
}

function TotalRow({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontWeight: bold ? 800 : 500, color: color ?? INK, fontSize: bold ? 16 : 13 }}>
      <span>{label}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )
}
