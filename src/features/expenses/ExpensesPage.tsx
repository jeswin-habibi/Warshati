import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { useBusiness } from '@/features/businesses/useBusiness'
import { useExpenses } from './api'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { formatMoney, formatDate } from '@/lib/format'

export default function ExpensesPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data: business } = useBusiness()
  const { data: expenses, isLoading } = useExpenses(business?.id ?? null)

  const now = new Date()
  const monthTotal = (expenses ?? [])
    .filter((e) => {
      const d = new Date(e.expense_date)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((s, e) => s + Number(e.amount || 0), 0)

  return (
    <div className="space-y-4">
      <ScreenHeader title={t('expenses.title')} />
      <Card>
        <CardContent className="py-5 text-center">
          <p className="text-sm font-semibold text-muted-foreground">{t('expenses.monthTotal')}</p>
          <p className="stat-number mt-1 text-destructive">{formatMoney(monthTotal)}</p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (expenses ?? []).length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">{t('expenses.empty')}</div>
      ) : (
        <ul className="space-y-2">
          {expenses!.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => nav(`/expenses/${e.id}`)}
                className="tap flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-start active:bg-accent"
              >
                <div className="min-w-0">
                  <div className="font-bold">{t(`expenses.cat_${e.category}`, e.category)}</div>
                  <div className="truncate text-sm text-muted-foreground">{e.description || formatDate(e.expense_date)}</div>
                </div>
                <span className="shrink-0 font-extrabold tabular-nums text-destructive">{formatMoney(e.amount)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button onClick={() => nav('/expenses/new')} size="lg" className="fixed bottom-24 end-4 z-30 shadow-lg shadow-primary/30">
        <Plus className="h-6 w-6" /> {t('expenses.add')}
      </Button>
    </div>
  )
}
