import { useTranslation } from 'react-i18next'
import { MessageCircle } from 'lucide-react'
import { useBusiness } from '@/features/businesses/useBusiness'
import { useFollowUps } from './api'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Spinner } from '@/components/ui/spinner'
import { locName } from '@/lib/loc'
import { waLink } from '@/lib/whatsapp'

export default function FollowUpsPage() {
  const { t } = useTranslation()
  const { data: business } = useBusiness()
  const { data: rows, isLoading } = useFollowUps(business?.id ?? null)

  function remind(name: string, phone: string | null) {
    const msg = t('insights.followUpMsg', { name, shop: business?.name ?? '' })
    window.open(waLink(phone, msg), '_blank')
  }

  return (
    <div className="space-y-3">
      <ScreenHeader title={t('insights.followUps')} />
      <p className="text-sm text-muted-foreground">{t('insights.followUpsHint')}</p>
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (rows ?? []).length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">{t('insights.noFollowUps')}</div>
      ) : (
        <ul className="space-y-2">
          {rows!.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card p-4">
              <div className="min-w-0">
                <div className="truncate font-bold">{locName(r.name, r.name_en)}</div>
                <div className="text-sm text-muted-foreground">{t('insights.daysAgo', { n: r.days })}</div>
              </div>
              {r.phone && (
                <button
                  onClick={() => remind(locName(r.name, r.name_en), r.phone)}
                  className="tap flex shrink-0 items-center gap-1.5 rounded-xl bg-success px-3 py-2 text-sm font-bold text-success-foreground"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t('insights.remind')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
