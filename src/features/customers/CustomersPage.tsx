import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Phone, Car } from 'lucide-react'
import { useBusiness } from '@/features/businesses/useBusiness'
import { useCustomers } from './api'
import { locName } from '@/lib/loc'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export default function CustomersPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data: business } = useBusiness()
  const { data: customers, isLoading } = useCustomers(business?.id ?? null)
  const [q, setQ] = useState('')

  const s = q.trim().toLowerCase()
  const list = (customers ?? []).filter((c) => {
    if (!s) return true
    return (
      c.name?.toLowerCase().includes(s) ||
      (c.name_en ?? '').toLowerCase().includes(s) ||
      (c.phone ?? '').includes(s) ||
      (c.alt_phone ?? '').includes(s) ||
      (c.vehicles ?? []).some((v) => v.plate_number?.toLowerCase().includes(s))
    )
  })

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('common.search')} className="ps-11" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : list.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">{t('customers.empty')}</div>
      ) : (
        <ul className="space-y-2">
          {list.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => nav(`/customers/${c.id}`)}
                className="tap flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-start active:bg-accent"
              >
                <div className="min-w-0">
                  <div className="truncate font-bold">{locName(c.name, c.name_en)}</div>
                  {c.phone && (
                    <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground" dir="ltr">
                      <Phone className="h-3.5 w-3.5" />
                      {c.phone}
                    </div>
                  )}
                </div>
                {(c.vehicles?.length ?? 0) > 0 && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">
                    <Car className="h-3.5 w-3.5" />
                    {c.vehicles!.length}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button
        onClick={() => nav('/customers/new')}
        size="lg"
        className="fixed bottom-24 end-4 z-30 shadow-lg shadow-primary/30"
      >
        <Plus className="h-6 w-6" /> {t('customers.add')}
      </Button>
    </div>
  )
}
