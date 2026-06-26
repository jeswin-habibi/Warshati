import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useBusiness } from '@/features/businesses/useBusiness'
import { useItems } from '@/features/inventory/api'
import type { InventoryItem } from '@/features/inventory/types'
import { useJobLineItems, useSaveLineItem } from './api'
import type { LineItemType } from './types'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Picker } from '@/components/Picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { formatMoney } from '@/lib/format'

const TYPES: LineItemType[] = ['labor', 'part', 'service', 'resale']

export default function LineItemForm() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { id: jobId, lineId } = useParams()
  const { data: business } = useBusiness()
  const { data: lines } = useJobLineItems(jobId)
  const { data: items } = useItems(business?.id ?? null)
  const save = useSaveLineItem(business?.id ?? null)

  const [type, setType] = useState<LineItemType>('labor')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [price, setPrice] = useState('')
  const [inventoryItemId, setInventoryItemId] = useState<string | null>(null)

  useEffect(() => {
    if (!lineId || !lines) return
    const l = lines.find((x) => x.id === lineId)
    if (l) {
      setType(l.type)
      setDescription(l.description)
      setQuantity(String(l.quantity))
      setPrice(String(l.unit_price))
      setInventoryItemId(l.inventory_item_id ?? null)
    }
  }, [lineId, lines])

  const selectedItem = (items ?? []).find((i) => i.id === inventoryItemId) ?? null

  function pickItem(item: InventoryItem | null) {
    setInventoryItemId(item?.id ?? null)
    if (item) {
      setType('part')
      setDescription(item.name_ar || item.name_en || '')
      setPrice(String(item.sell_price ?? ''))
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!jobId || !description.trim()) return
    await save.mutateAsync({
      id: lineId,
      job_id: jobId,
      type,
      description: description.trim(),
      quantity: Number(quantity) || 1,
      unit_price: Number(price) || 0,
      inventory_item_id: inventoryItemId,
    })
    nav(`/jobs/${jobId}`, { replace: true })
  }

  const lineTotal = (Number(quantity) || 0) * (Number(price) || 0)

  return (
    <form onSubmit={submit} className="flex min-h-[70svh] flex-col">
      <ScreenHeader title={lineId ? t('jobs.editItem') : t('jobs.addItem')} />
      <div className="space-y-4">
        {(items ?? []).length > 0 && (
          <div>
            <Label>{t('jobs.fromInventory')}</Label>
            <Picker<InventoryItem>
              value={selectedItem}
              onChange={pickItem}
              items={items ?? []}
              getKey={(i) => i.id}
              getLabel={(i) => i.name_ar || i.name_en || '—'}
              getSub={(i) => `${formatMoney(i.sell_price)}${i.track_stock ? ' · ' + i.current_stock : ''}`}
              placeholder={t('jobs.pickItem')}
              searchPlaceholder={t('common.search')}
              allowClear
              clearLabel={t('jobs.freeText')}
              filter={(i, q) => (i.name_ar + ' ' + (i.name_en ?? '')).toLowerCase().includes(q)}
            />
          </div>
        )}
        <div>
          <Label>{t('jobs.itemType')}</Label>
          <Select value={type} onChange={(e) => setType(e.target.value as LineItemType)}>
            {TYPES.map((ty) => (
              <option key={ty} value={ty}>{t(`jobs.${ty}`)}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t('jobs.description')}</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} autoFocus required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t('jobs.qty')}</Label>
            <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} inputMode="decimal" dir="ltr" />
          </div>
          <div>
            <Label>{t('jobs.price')}</Label>
            <Input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" dir="ltr" />
          </div>
        </div>
        <div className="rounded-2xl bg-accent px-4 py-3 text-center text-accent-foreground">
          <span className="text-sm">{t('jobs.total')}: </span>
          <span className="text-lg font-extrabold tabular-nums">{lineTotal.toFixed(3)}</span>
        </div>
      </div>

      <Button type="submit" size="lg" className="mt-8 w-full" disabled={!description.trim() || save.isPending}>
        {save.isPending ? t('common.loading') : t('common.save')}
      </Button>
    </form>
  )
}
