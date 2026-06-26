import { useTranslation } from 'react-i18next'
import { useBusiness } from '@/features/businesses/useBusiness'
import { useProfit } from './api'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { formatMoney } from '@/lib/format'

export default function ProfitPage() {
  const { t } = useTranslation()
  const { data: business } = useBusiness()
  const { data: lines, isLoading } = useProfit(business?.id ?? null)

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>

  let revenue = 0
  let cost = 0
  const byItem = new Map<string, number>()
  for (const l of lines ?? []) {
    const rev = Number(l.total || 0)
    revenue += rev
    const c = l.type === 'part' ? Number(l.inventory?.cost_price ?? 0) * Number(l.quantity || 0) : 0
    cost += c
    byItem.set(l.description, (byItem.get(l.description) ?? 0) + (rev - c))
  }
  const gross = revenue - cost
  const margin = revenue > 0 ? (gross / revenue) * 100 : 0
  const top = [...byItem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)

  return (
    <div className="space-y-4">
      <ScreenHeader title={t('insights.profit')} />
      <Card className="gradient-primary border-0 text-primary-foreground shadow-lift">
        <CardContent className="py-6 text-center">
          <p className="text-sm font-semibold opacity-90">{t('insights.grossProfit')}</p>
          <p className="stat-number mt-1">{formatMoney(gross)}</p>
          <p className="mt-1 text-sm opacity-90">{t('insights.margin')}: {margin.toFixed(0)}%</p>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('insights.revenue')}</p>
          <p className="stat-number mt-1 text-2xl text-success">{formatMoney(revenue)}</p>
        </CardContent></Card>
        <Card><CardContent className="py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('insights.partsCost')}</p>
          <p className="stat-number mt-1 text-2xl text-destructive">{formatMoney(cost)}</p>
        </CardContent></Card>
      </div>
      {top.length > 0 && (
        <Card><CardContent>
          <p className="mb-2 font-bold">{t('insights.topProfit')}</p>
          <ul className="space-y-1.5">
            {top.map(([name, profit]) => (
              <li key={name} className="flex items-center justify-between gap-2">
                <span className="truncate">{name}</span>
                <span className="shrink-0 font-bold tabular-nums text-success">{formatMoney(profit)}</span>
              </li>
            ))}
          </ul>
        </CardContent></Card>
      )}
    </div>
  )
}
