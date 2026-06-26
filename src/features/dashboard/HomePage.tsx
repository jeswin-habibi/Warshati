import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Users, Wrench, Package, CalendarCheck } from 'lucide-react'
import { useBusiness } from '@/features/businesses/useBusiness'
import { useInvoices } from './api'
import { useJobs } from '@/features/jobs/api'
import { useCustomers } from '@/features/customers/api'
import { useItems } from '@/features/inventory/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatMoney, formatNumber } from '@/lib/format'

// Kuwait week starts Saturday (weekend Fri–Sat).
function weekStart() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 1) % 7))
  return d.getTime()
}
function monthStart() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}

export default function HomePage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data: business } = useBusiness()
  const { data: invoices } = useInvoices(business?.id ?? null)
  const { data: jobs } = useJobs(business?.id ?? null)
  const { data: customers } = useCustomers(business?.id ?? null)
  const { data: items } = useItems(business?.id ?? null)

  const ws = weekStart()
  const ms = monthStart()
  const revFrom = (from: number) =>
    (invoices ?? []).filter((i) => new Date(i.issued_at).getTime() >= from).reduce((s, i) => s + Number(i.total || 0), 0)
  const monthJobs = (jobs ?? []).filter((j) => new Date(j.created_at).getTime() >= ms).length
  const lowStock = (items ?? []).filter(
    (i) => i.track_stock && i.min_stock_alert != null && Number(i.current_stock) <= Number(i.min_stock_alert),
  ).length

  const byCustomer = new Map<string, number>()
  for (const i of invoices ?? []) {
    if (new Date(i.issued_at).getTime() < ms) continue
    const name = i.job?.customer?.name ?? t('jobs.walkIn')
    byCustomer.set(name, (byCustomer.get(name) ?? 0) + Number(i.total || 0))
  }
  const topCustomers = [...byCustomer.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="space-y-4">
      {business && <h1 className="text-2xl font-extrabold">{business.name}</h1>}

      <Card className="bg-primary text-primary-foreground">
        <CardContent className="py-6 text-center">
          <p className="text-sm font-semibold opacity-90">{t('home.monthRevenue')}</p>
          <p className="stat-number mt-1">{formatMoney(revFrom(ms))}</p>
          <p className="mt-1 text-sm opacity-90">{t('home.weekRevenue')}: {formatMoney(revFrom(ws))}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => nav('/jobs')} className="tap rounded-2xl border border-border bg-card p-3 text-center">
          <Wrench className="mx-auto mb-1 h-5 w-5 text-primary" />
          <div className="stat-number text-xl">{formatNumber(monthJobs)}</div>
          <div className="text-xs text-muted-foreground">{t('home.jobsMonth')}</div>
        </button>
        <button onClick={() => nav('/customers')} className="tap rounded-2xl border border-border bg-card p-3 text-center">
          <Users className="mx-auto mb-1 h-5 w-5 text-primary" />
          <div className="stat-number text-xl">{formatNumber((customers ?? []).length)}</div>
          <div className="text-xs text-muted-foreground">{t('nav.customers')}</div>
        </button>
        <button onClick={() => nav('/inventory')} className="tap rounded-2xl border border-border bg-card p-3 text-center">
          <Package className="mx-auto mb-1 h-5 w-5 text-primary" />
          <div className={`stat-number text-xl ${lowStock > 0 ? 'text-destructive' : ''}`}>{formatNumber(lowStock)}</div>
          <div className="text-xs text-muted-foreground">{t('home.lowStock')}</div>
        </button>
      </div>

      <Button onClick={() => nav('/daily-close')} size="lg" variant="secondary" className="w-full">
        <CalendarCheck className="h-5 w-5" />
        {t('dailyClose.title')}
      </Button>

      {topCustomers.length > 0 && (
        <Card>
          <CardContent>
            <p className="mb-2 font-bold">{t('home.topCustomers')}</p>
            <ul className="space-y-1.5">
              {topCustomers.map(([name, total]) => (
                <li key={name} className="flex items-center justify-between gap-2">
                  <span className="truncate">{name}</span>
                  <span className="shrink-0 font-bold tabular-nums">{formatMoney(total)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
