import { useTranslation } from 'react-i18next'
import { MessageCircle, Check } from 'lucide-react'
import { useBusiness } from '@/features/businesses/useBusiness'
import { useUnpaid, useMarkPaid, type UnpaidInvoice } from './api'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { locName } from '@/lib/loc'
import { waLink } from '@/lib/whatsapp'
import { formatMoney, formatDate } from '@/lib/format'

export default function MoneyOwedPage() {
  const { t } = useTranslation()
  const { data: business } = useBusiness()
  const { data: rows, isLoading } = useUnpaid(business?.id ?? null)
  const markPaid = useMarkPaid(business?.id ?? null)
  const total = (rows ?? []).reduce((s, i) => s + Number(i.balance || 0), 0)

  function remind(inv: UnpaidInvoice) {
    const name = locName(inv.job?.customer?.name, inv.job?.customer?.name_en)
    const msg = t('insights.owedMsg', { name, amount: formatMoney(inv.balance), shop: business?.name ?? '' })
    window.open(waLink(inv.job?.customer?.phone, msg), '_blank')
  }

  return (
    <div className="space-y-4">
      <ScreenHeader title={t('insights.moneyOwed')} />
      <Card>
        <CardContent className="py-5 text-center">
          <p className="text-sm font-semibold text-muted-foreground">{t('insights.moneyOwed')}</p>
          <p className="stat-number mt-1 text-amber-600">{formatMoney(total)}</p>
        </CardContent>
      </Card>
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (rows ?? []).length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">{t('insights.noOwed')}</div>
      ) : (
        <ul className="space-y-2">
          {rows!.map((inv) => (
            <li key={inv.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-bold">
                    {locName(inv.job?.customer?.name, inv.job?.customer?.name_en) || inv.invoice_number}
                  </div>
                  <div className="text-sm text-muted-foreground">{formatDate(inv.issued_at)}</div>
                </div>
                <span className="shrink-0 font-extrabold tabular-nums text-amber-600">{formatMoney(inv.balance)}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {inv.job?.customer?.phone && (
                  <button
                    onClick={() => remind(inv)}
                    className="tap flex items-center justify-center gap-1.5 rounded-xl bg-success px-3 py-2 text-sm font-bold text-success-foreground"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {t('insights.remind')}
                  </button>
                )}
                <button
                  onClick={() => markPaid.mutate({ id: inv.id, total: inv.total })}
                  className="tap col-span-1 flex items-center justify-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-sm font-bold"
                >
                  <Check className="h-4 w-4" />
                  {t('insights.markPaid')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
