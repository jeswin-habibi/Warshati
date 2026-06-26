import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Users, Wrench, CalendarCheck, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { useBusiness } from '@/features/businesses/useBusiness'
import { useInvoices, useLineItems } from './api'
import { useJobs } from '@/features/jobs/api'
import { useCustomers } from '@/features/customers/api'
import { useItems } from '@/features/inventory/api'
import { useExpenses } from '@/features/expenses/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatMoney, formatNumber } from '@/lib/format'
import { locName } from '@/lib/loc'

const DAY = 86_400_000
const startOfDay = (t: number) => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
const monthStart = (offset = 0) => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + offset, 1).getTime()
}

export default function HomePage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data: business } = useBusiness()
  const { data: invoices } = useInvoices(business?.id ?? null)
  const { data: jobs } = useJobs(business?.id ?? null)
  const { data: customers } = useCustomers(business?.id ?? null)
  const { data: items } = useItems(business?.id ?? null)
  const { data: expenses } = useExpenses(business?.id ?? null)
  const { data: lineItems } = useLineItems(business?.id ?? null)

  const inv = invoices ?? []
  const ts = (iso: string) => new Date(iso).getTime()
  const ms = monthStart(0)
  const lms = monthStart(-1)

  const monthRev = inv.filter((i) => ts(i.issued_at) >= ms).reduce((s, i) => s + Number(i.total || 0), 0)
  const lastMonthRev = inv.filter((i) => ts(i.issued_at) >= lms && ts(i.issued_at) < ms).reduce((s, i) => s + Number(i.total || 0), 0)
  const delta = lastMonthRev > 0 ? ((monthRev - lastMonthRev) / lastMonthRev) * 100 : monthRev > 0 ? 100 : 0
  const monthExp = (expenses ?? []).filter((e) => new Date(e.expense_date).getTime() >= ms).reduce((s, e) => s + Number(e.amount || 0), 0)
  const net = monthRev - monthExp

  const monthInvoices = inv.filter((i) => ts(i.issued_at) >= ms)
  const avgInvoice = monthInvoices.length ? monthRev / monthInvoices.length : 0
  const outstanding = inv.reduce((s, i) => s + Number(i.balance || 0), 0)
  const monthJobs = (jobs ?? []).filter((j) => new Date(j.created_at).getTime() >= ms).length
  const newCustomers = (customers ?? []).filter((c) => new Date(c.created_at).getTime() >= ms).length

  const today0 = startOfDay(Date.now())
  const days = Array.from({ length: 14 }, (_, k) => {
    const day = today0 - (13 - k) * DAY
    return inv.filter((i) => startOfDay(ts(i.issued_at)) === day).reduce((s, i) => s + Number(i.total || 0), 0)
  })
  const maxDay = Math.max(1, ...days)

  const statusCounts: Record<string, number> = { estimate: 0, in_progress: 0, completed: 0, cancelled: 0 }
  for (const j of jobs ?? []) statusCounts[j.status] = (statusCounts[j.status] ?? 0) + 1

  const byCust = new Map<string, number>()
  for (const i of inv) {
    const n = locName(i.job?.customer?.name, i.job?.customer?.name_en) || t('jobs.walkIn')
    byCust.set(n, (byCust.get(n) ?? 0) + Number(i.total || 0))
  }
  const topCustomers = [...byCust.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)

  const byPart = new Map<string, number>()
  for (const l of lineItems ?? []) {
    if (l.type === 'part' || l.type === 'resale') byPart.set(l.description, (byPart.get(l.description) ?? 0) + Number(l.total || 0))
  }
  const topParts = [...byPart.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)

  const lowItems = (items ?? []).filter(
    (i) => i.track_stock && i.min_stock_alert != null && Number(i.current_stock) <= Number(i.min_stock_alert),
  )
  const revExpMax = Math.max(1, monthRev, monthExp)

  return (
    <div className="space-y-4">
      {business && <h1 className="text-2xl font-extrabold">{business.name}</h1>}

      <Card className="bg-primary text-primary-foreground">
        <CardContent className="py-6">
          <p className="text-center text-sm font-semibold opacity-90">{t('home.monthRevenue')}</p>
          <p className="stat-number mt-1 text-center">{formatMoney(monthRev)}</p>
          <div className="mt-2 flex items-center justify-center gap-1 text-sm font-semibold">
            {delta >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span dir="ltr">{delta >= 0 ? '+' : ''}{delta.toFixed(0)}%</span>
            <span className="opacity-80">{t('home.vsLastMonth')}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold">{t('home.netProfit')}</span>
            <span className={`stat-number text-2xl ${net >= 0 ? 'text-success' : 'text-destructive'}`}>{formatMoney(net)}</span>
          </div>
          <Bar label={t('home.revenue')} value={monthRev} max={revExpMax} color="bg-success" />
          <Bar label={t('home.expenses')} value={monthExp} max={revExpMax} color="bg-destructive" />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="mb-3 text-sm font-semibold text-muted-foreground">{t('home.last14')}</p>
          <div className="flex h-24 items-end gap-0.5">
            {days.map((v, i) => (
              <div key={i} className="flex-1 rounded-t bg-primary/80" style={{ height: `${Math.max((v / maxDay) * 100, v > 0 ? 5 : 0)}%` }} />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Kpi label={t('home.jobsMonth')} value={formatNumber(monthJobs)} onClick={() => nav('/jobs')} icon={<Wrench className="h-4 w-4" />} />
        <Kpi label={t('home.avgInvoice')} value={formatMoney(avgInvoice)} />
        <Kpi label={t('home.newCustomers')} value={formatNumber(newCustomers)} onClick={() => nav('/customers')} icon={<Users className="h-4 w-4" />} />
        <Kpi label={t('home.outstanding')} value={formatMoney(outstanding)} tone={outstanding > 0 ? 'text-amber-600' : undefined} />
      </div>

      <Card>
        <CardContent>
          <p className="mb-2 text-sm font-semibold text-muted-foreground">{t('home.pipeline')}</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {(['estimate', 'in_progress', 'completed'] as const).map((s) => (
              <div key={s} className="rounded-xl bg-secondary py-2">
                <div className="text-xl font-extrabold tabular-nums">{formatNumber(statusCounts[s] ?? 0)}</div>
                <div className="text-[11px] text-muted-foreground">{t(`jobs.status.${s}`)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {topCustomers.length > 0 && <ListCard title={t('home.topCustomers')} rows={topCustomers} />}
      {topParts.length > 0 && <ListCard title={t('home.topParts')} rows={topParts} />}

      {lowItems.length > 0 && (
        <Card>
          <CardContent>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {t('home.lowStock')}
            </p>
            <ul className="space-y-1.5">
              {lowItems.slice(0, 5).map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">{locName(i.name_ar, i.name_en)}</span>
                  <span className="font-bold tabular-nums text-destructive">{formatNumber(i.current_stock)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Button onClick={() => nav('/daily-close')} size="lg" variant="secondary" className="w-full">
        <CalendarCheck className="h-5 w-5" />
        {t('dailyClose.title')}
      </Button>
    </div>
  )
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold tabular-nums">{formatMoney(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  )
}

function Kpi({ label, value, onClick, icon, tone }: { label: string; value: string; onClick?: () => void; icon?: ReactNode; tone?: string }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className="rounded-2xl border border-border bg-card p-3 text-start disabled:cursor-default">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">{icon}{label}</div>
      <div className={`stat-number mt-1 text-2xl ${tone ?? ''}`}>{value}</div>
    </button>
  )
}

function ListCard({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <Card>
      <CardContent>
        <p className="mb-2 font-bold">{title}</p>
        <ul className="space-y-1.5">
          {rows.map(([name, total]) => (
            <li key={name} className="flex items-center justify-between gap-2">
              <span className="truncate">{name}</span>
              <span className="shrink-0 font-bold tabular-nums">{formatMoney(total)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
