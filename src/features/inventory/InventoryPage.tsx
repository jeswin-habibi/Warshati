import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Package, AlertTriangle } from 'lucide-react'
import { useBusiness } from '@/features/businesses/useBusiness'
import { useItems } from './api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Thumb } from '@/components/Thumb'
import { formatMoney, formatNumber } from '@/lib/format'
import { locName } from '@/lib/loc'

export default function InventoryPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data: business } = useBusiness()
  const { data: items, isLoading } = useItems(business?.id ?? null)
  const [q, setQ] = useState('')

  const s = q.trim().toLowerCase()
  const list = (items ?? []).filter(
    (i) => !s || i.name_ar.toLowerCase().includes(s) || (i.name_en ?? '').toLowerCase().includes(s) || (i.sku ?? '').toLowerCase().includes(s),
  )

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('common.search')} className="ps-11" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : list.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">{t('inventory.empty')}</div>
      ) : (
        <ul className="space-y-2">
          {list.map((i) => {
            const low = i.track_stock && i.min_stock_alert != null && Number(i.current_stock) <= Number(i.min_stock_alert)
            return (
              <li key={i.id}>
                <button
                  onClick={() => nav(`/inventory/${i.id}`)}
                  className="tap flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-start active:bg-accent"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-accent text-accent-foreground">
                    {i.photo_url ? <Thumb path={i.photo_url} /> : <Package className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{locName(i.name_ar, i.name_en)}</div>
                    <div className="text-sm tabular-nums text-muted-foreground">{formatMoney(i.sell_price)}</div>
                  </div>
                  <div className="shrink-0 text-end">
                    {i.track_stock ? (
                      <div className={`text-lg font-extrabold tabular-nums ${low ? 'text-destructive' : ''}`}>{formatNumber(i.current_stock)}</div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t('inventory.notTracked')}</span>
                    )}
                    {low && (
                      <span className="flex items-center justify-end gap-1 text-[10px] font-bold text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        {t('inventory.lowStock')}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <Button onClick={() => nav('/inventory/new')} size="lg" className="fixed bottom-24 end-4 z-30 shadow-lg shadow-primary/30">
        <Plus className="h-6 w-6" /> {t('inventory.add')}
      </Button>
    </div>
  )
}
