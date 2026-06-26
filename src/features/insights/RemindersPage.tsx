import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Droplet, Wrench, MessageCircle } from 'lucide-react'
import { useBusiness } from '@/features/businesses/useBusiness'
import { useReminders, type Reminder } from './api'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Spinner } from '@/components/ui/spinner'
import { locName } from '@/lib/loc'
import { waLink } from '@/lib/whatsapp'

export default function RemindersPage() {
  const { t } = useTranslation()
  const { data: business } = useBusiness()
  const { data, isLoading } = useReminders(business?.id ?? null)

  function remind(r: Reminder, kind: 'oil' | 'maint') {
    const name = locName(r.name, r.name_en)
    const msg =
      kind === 'oil'
        ? t('reminders.oilMsg', { name, days: r.days, shop: business?.name ?? '' })
        : t('reminders.maintMsg', { name, shop: business?.name ?? '' })
    window.open(waLink(r.phone, msg), '_blank')
  }

  function Section({ title, hint, icon, rows, kind }: { title: string; hint: string; icon: ReactNode; rows: Reminder[]; kind: 'oil' | 'maint' }) {
    return (
      <div>
        <div className="mb-2 flex items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">{icon}</span>
          <div>
            <h2 className="font-extrabold">{title} {rows.length > 0 && <span className="text-muted-foreground">· {rows.length}</span>}</h2>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        </div>
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">{t('reminders.none')}</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card p-4">
                <div className="min-w-0">
                  <div className="truncate font-bold">{locName(r.name, r.name_en)}</div>
                  <div className="text-sm text-muted-foreground">{t('reminders.sinceDays', { n: r.days })}</div>
                </div>
                {r.phone && (
                  <button
                    onClick={() => remind(r, kind)}
                    className="tap flex shrink-0 items-center gap-1.5 rounded-xl bg-success px-3 py-2 text-sm font-bold text-success-foreground"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {t('reminders.remind')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>

  return (
    <div className="space-y-6">
      <ScreenHeader title={t('reminders.title')} />
      <Section title={t('reminders.oil')} hint={t('reminders.oilHint')} icon={<Droplet className="h-5 w-5" />} rows={data?.oil ?? []} kind="oil" />
      <Section title={t('reminders.maintenance')} hint={t('reminders.maintHint')} icon={<Wrench className="h-5 w-5" />} rows={data?.maintenance ?? []} kind="maint" />
    </div>
  )
}
