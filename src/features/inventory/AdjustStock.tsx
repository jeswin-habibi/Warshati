import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Minus, Plus } from 'lucide-react'
import { useBusiness } from '@/features/businesses/useBusiness'
import { useItem, useAdjustStock } from './api'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { formatNumber } from '@/lib/format'

const REASONS = ['correction', 'damaged', 'returned'] as const

export default function AdjustStock() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { id } = useParams()
  const { data: business } = useBusiness()
  const { data: item, isLoading } = useItem(id)
  const adjust = useAdjustStock(business?.id ?? null)
  const [dir, setDir] = useState<1 | -1>(1)
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState<string>('correction')

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!item) return <div className="py-16 text-center text-muted-foreground">—</div>

  const delta = dir * (Number(qty) || 0)
  const next = Number(item.current_stock) + delta

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!item || !qty) return
    await adjust.mutateAsync({ item, delta, reason })
    nav('/inventory', { replace: true })
  }

  return (
    <form onSubmit={submit} className="flex min-h-[70svh] flex-col">
      <ScreenHeader title={item.name_ar} />
      <div className="space-y-4">
        <div className="rounded-2xl bg-accent p-4 text-center text-accent-foreground">
          <div className="text-sm">{t('inventory.stock')}</div>
          <div className="stat-number tabular-nums">{formatNumber(item.current_stock)} → {formatNumber(next)}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDir(1)}
            className={`tap flex items-center justify-center gap-1 rounded-2xl border-2 py-4 font-bold ${dir === 1 ? 'border-success bg-success/10 text-success' : 'border-input'}`}
          >
            <Plus className="h-5 w-5" />
            {t('inventory.addStock')}
          </button>
          <button
            type="button"
            onClick={() => setDir(-1)}
            className={`tap flex items-center justify-center gap-1 rounded-2xl border-2 py-4 font-bold ${dir === -1 ? 'border-destructive bg-destructive/10 text-destructive' : 'border-input'}`}
          >
            <Minus className="h-5 w-5" />
            {t('inventory.removeStock')}
          </button>
        </div>
        <div>
          <Label>{t('inventory.change')}</Label>
          <Input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" dir="ltr" autoFocus />
        </div>
        <div>
          <Label>{t('inventory.adjustReason')}</Label>
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS.map((r) => (
              <option key={r} value={r}>{t(`inventory.reason_${r}`)}</option>
            ))}
          </Select>
        </div>
      </div>
      <Button type="submit" size="lg" className="mt-8 w-full" disabled={!qty || adjust.isPending}>
        {adjust.isPending ? t('common.loading') : t('common.save')}
      </Button>
    </form>
  )
}
