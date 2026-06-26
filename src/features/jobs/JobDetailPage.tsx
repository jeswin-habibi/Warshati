import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, CheckCircle2, Share2 } from 'lucide-react'
import { useBusiness } from '@/features/businesses/useBusiness'
import {
  useJob, useJobLineItems, useInvoiceForJob, useDeleteJob, useDeleteLineItem, useCompleteJob,
} from './api'
import type { LineItemType } from './types'
import { ScreenHeader } from '@/components/ScreenHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { formatMoney } from '@/lib/format'

const TYPE_KEY: Record<LineItemType, string> = {
  labor: 'jobs.labor',
  part: 'jobs.part',
  service: 'jobs.service',
  resale: 'jobs.resale',
}

export default function JobDetailPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { id } = useParams()
  const { data: business } = useBusiness()
  const { data: job, isLoading } = useJob(id)
  const { data: lines } = useJobLineItems(id)
  const { data: invoice } = useInvoiceForJob(id)
  const delJob = useDeleteJob()
  const delLine = useDeleteLineItem(id ?? '')
  const complete = useCompleteJob(business?.id ?? null)

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!job) return <div className="py-16 text-center text-muted-foreground">—</div>

  const subtotal = (lines ?? []).reduce((s, l) => s + Number(l.total || 0), 0)
  const done = job.status === 'completed'

  async function removeJob() {
    if (!job) return
    if (!confirm(t('jobs.deleteConfirm'))) return
    await delJob.mutateAsync(job.id)
    nav('/jobs', { replace: true })
  }

  async function markComplete() {
    if (!job) return
    if ((lines ?? []).length === 0) {
      alert(t('jobs.needLines'))
      return
    }
    await complete.mutateAsync({ jobId: job.id, subtotal })
  }

  function shareWhatsApp() {
    const raw = (job?.customer?.phone ?? '').replace(/\D/g, '')
    const phone = raw ? (raw.length === 8 ? `965${raw}` : raw) : ''
    const msg = t('jobs.invoiceMsg', {
      shop: business?.name ?? '',
      total: formatMoney(invoice?.total ?? subtotal),
    })
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="space-y-4 pb-4">
      <ScreenHeader title={job.customer?.name || t('jobs.walkIn')} action={<StatusBadge status={job.status} />} />

      <Card>
        <CardContent className="space-y-1.5">
          {job.vehicle && (
            <div className="font-bold" dir="ltr">
              {job.vehicle.plate_number || [job.vehicle.make, job.vehicle.model].filter(Boolean).join(' ')}
            </div>
          )}
          {job.complaint_text && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{job.complaint_text}</p>}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold">{t('jobs.items')}</h2>
        {!done && (
          <button
            type="button"
            onClick={() => nav(`/jobs/${job.id}/line/new`)}
            className="tap flex items-center gap-1 rounded-xl px-3 text-sm font-bold text-primary"
          >
            <Plus className="h-5 w-5" />
            {t('jobs.addItem')}
          </button>
        )}
      </div>

      {(lines ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">{t('jobs.noItems')}</p>
      ) : (
        <ul className="space-y-2">
          {lines!.map((l) => (
            <li key={l.id} className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3">
              <button
                type="button"
                onClick={() => { if (!done) nav(`/jobs/${job.id}/line/${l.id}`) }}
                className="min-w-0 flex-1 text-start"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">{t(TYPE_KEY[l.type])}</span>
                  <span className="truncate font-semibold">{l.description}</span>
                </div>
                <div className="mt-0.5 text-sm tabular-nums text-muted-foreground">{l.quantity} × {formatMoney(l.unit_price)}</div>
              </button>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-bold tabular-nums">{formatMoney(l.total)}</span>
                {!done && (
                  <button type="button" onClick={() => delLine.mutate(l.id)} aria-label="delete" className="tap p-1 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Card>
        <CardContent className="flex items-center justify-between">
          <span className="font-bold">{t('jobs.total')}</span>
          <span className="stat-number text-primary">{formatMoney(invoice?.total ?? subtotal)}</span>
        </CardContent>
      </Card>

      {done ? (
        <>
          {invoice?.invoice_number && <p className="text-center text-sm text-muted-foreground" dir="ltr">{invoice.invoice_number}</p>}
          <Button size="lg" className="w-full" onClick={shareWhatsApp}>
            <Share2 className="h-5 w-5" />
            {t('jobs.share')}
          </Button>
        </>
      ) : (
        <Button size="lg" className="w-full" onClick={markComplete} disabled={complete.isPending}>
          <CheckCircle2 className="h-5 w-5" />
          {t('jobs.complete')}
        </Button>
      )}

      <button type="button" onClick={removeJob} className="mx-auto block py-2 text-sm font-semibold text-destructive">
        {t('jobs.delete')}
      </button>
    </div>
  )
}
