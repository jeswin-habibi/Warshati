import { useTranslation } from 'react-i18next'
import { useBusiness } from '@/features/businesses/useBusiness'
import { useInvoices } from '@/features/dashboard/api'
import { useExpenses } from '@/features/expenses/api'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { formatMoney, formatNumber } from '@/lib/format'

function isToday(d: Date) {
  const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

export default function DailyClosePage() {
  const { t } = useTranslation()
  const { data: business } = useBusiness()
  const { data: invoices, isLoading } = useInvoices(business?.id ?? null)
  const { data: expenses } = useExpenses(business?.id ?? null)

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>

  const todayInv = (invoices ?? []).filter((i) => isToday(new Date(i.issued_at)))
  const revenue = todayInv.reduce((s, i) => s + Number(i.total || 0), 0)
  const pending = (invoices ?? []).filter((i) => Number(i.balance || 0) > 0)
  const pendingTotal = pending.reduce((s, i) => s + Number(i.balance || 0), 0)
  const todayExp = (expenses ?? []).filter((e) => isToday(new Date(e.expense_date)))
  const expense = todayExp.reduce((s, e) => s + Number(e.amount || 0), 0)
  const net = revenue - expense

  return (
    <div className="space-y-4">
      <ScreenHeader title={t('dailyClose.title')} />

      <Card className="gradient-primary border-0 text-primary-foreground shadow-lift">
        <CardContent className="py-6 text-center">
          <p className="text-sm font-semibold opacity-90">{t('dailyClose.revenue')}</p>
          <p className="stat-number mt-1">{formatMoney(revenue)}</p>
          <p className="mt-1 text-sm opacity-90">{formatNumber(todayInv.length)} {t('dailyClose.invoices')}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('dailyClose.expenses')}</p>
          <p className="stat-number mt-1 text-destructive">{formatMoney(expense)}</p>
        </CardContent></Card>
        <Card><CardContent className="py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('dailyClose.net')}</p>
          <p className={`stat-number mt-1 ${net >= 0 ? 'text-success' : 'text-destructive'}`}>{formatMoney(net)}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-bold">{t('dailyClose.pending')}</p>
            <p className="text-sm text-muted-foreground">{formatNumber(pending.length)} {t('dailyClose.invoices')}</p>
          </div>
          <span className="stat-number text-amber-600">{formatMoney(pendingTotal)}</span>
        </CardContent>
      </Card>
    </div>
  )
}
