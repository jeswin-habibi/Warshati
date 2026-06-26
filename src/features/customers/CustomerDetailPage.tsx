import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Phone, Pencil, Trash2, Plus, Car } from 'lucide-react'
import { useCustomer, useVehicles, useDeleteCustomer } from './api'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { VoiceNote } from '@/components/VoiceNote'
import { locName } from '@/lib/loc'

export default function CustomerDetailPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { id } = useParams()
  const { data: c, isLoading } = useCustomer(id)
  const { data: vehicles } = useVehicles(id)
  const del = useDeleteCustomer()

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!c) return <div className="py-16 text-center text-muted-foreground">—</div>

  async function remove() {
    if (!c) return
    if (!confirm(t('customers.deleteConfirm'))) return
    await del.mutateAsync(c.id)
    nav('/customers', { replace: true })
  }

  return (
    <div className="space-y-4">
      <ScreenHeader
        title={locName(c.name, c.name_en)}
        action={
          <button
            type="button"
            onClick={() => nav(`/customers/${c.id}/edit`)}
            aria-label="edit"
            className="tap flex items-center justify-center rounded-xl p-2 text-primary"
          >
            <Pencil className="h-5 w-5" />
          </button>
        }
      />

      <Card>
        <CardContent className="space-y-2">
          {c.phone ? (
            <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-lg font-bold text-primary" dir="ltr">
              <Phone className="h-5 w-5" />
              {c.phone}
            </a>
          ) : (
            <p className="text-muted-foreground">{t('customers.phone')}: —</p>
          )}
          {c.alt_phone && <div className="text-muted-foreground" dir="ltr">{c.alt_phone}</div>}
          {c.civil_id && <div className="text-sm text-muted-foreground" dir="ltr">{t('customers.civilId')}: {c.civil_id}</div>}
          {c.notes && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{c.notes}</p>}
          {c.voice_note_url && <VoiceNote businessId={null} value={c.voice_note_url} readOnly />}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold">{t('customers.vehicles')}</h2>
        <button
          type="button"
          onClick={() => nav(`/customers/${c.id}/vehicle/new`)}
          className="tap flex items-center gap-1 rounded-xl px-3 text-sm font-bold text-primary"
        >
          <Plus className="h-5 w-5" />
          {t('vehicles.add')}
        </button>
      </div>

      {(vehicles ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          {t('customers.noVehicles')}
        </p>
      ) : (
        <ul className="space-y-2">
          {vehicles!.map((v) => (
            <li key={v.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <Car className="h-6 w-6 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="font-bold" dir="ltr">{v.plate_number || '—'}</div>
                <div className="truncate text-sm text-muted-foreground">
                  {[v.make, v.model, v.year].filter(Boolean).join(' ') || '—'}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button variant="destructive" className="w-full" onClick={remove} disabled={del.isPending}>
        <Trash2 className="h-5 w-5" /> {t('common.delete')}
      </Button>
    </div>
  )
}
