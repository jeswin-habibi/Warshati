import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SlidersHorizontal } from 'lucide-react'
import { useBusiness } from '@/features/businesses/useBusiness'
import { useItem, useItems, useSaveItem, useDeleteItem } from './api'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { PhotoField } from '@/components/PhotoField'

export default function ItemForm() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { id } = useParams()
  const { data: business } = useBusiness()
  const existing = useItem(id)
  const { data: allItems } = useItems(business?.id ?? null)
  const save = useSaveItem(business?.id ?? null)
  const del = useDeleteItem()

  // Existing categories for the autocomplete datalist.
  const categories = [...new Set((allItems ?? []).map((x) => x.category).filter((c): c is string => !!c))].sort()

  const [nameAr, setNameAr] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [category, setCategory] = useState('')
  const [cost, setCost] = useState('')
  const [sell, setSell] = useState('')
  const [stock, setStock] = useState('0')
  const [minAlert, setMinAlert] = useState('')
  const [track, setTrack] = useState(true)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    const i = existing.data
    if (!i) return
    setNameAr(i.name_ar ?? '')
    setNameEn(i.name_en ?? '')
    setCategory(i.category ?? '')
    setCost(String(i.cost_price ?? ''))
    setSell(String(i.sell_price ?? ''))
    setStock(String(i.current_stock ?? 0))
    setMinAlert(i.min_stock_alert != null ? String(i.min_stock_alert) : '')
    setTrack(i.track_stock)
    setPhotoUrl(i.photo_url ?? null)
  }, [existing.data])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!nameAr.trim()) return
    await save.mutateAsync({
      id,
      name_ar: nameAr.trim(),
      name_en: nameEn.trim() || null,
      category: category.trim() || null,
      cost_price: Number(cost) || 0,
      sell_price: Number(sell) || 0,
      current_stock: id ? undefined : Number(stock) || 0,
      min_stock_alert: minAlert ? Number(minAlert) : null,
      track_stock: track,
      photo_url: photoUrl,
    })
    nav('/inventory', { replace: true })
  }

  async function remove() {
    if (!id) return
    if (!confirm(t('inventory.deleteConfirm'))) return
    await del.mutateAsync(id)
    nav('/inventory', { replace: true })
  }

  if (id && existing.isLoading) return <div className="flex justify-center py-16"><Spinner /></div>

  return (
    <form onSubmit={submit} className="flex min-h-[70svh] flex-col">
      <ScreenHeader
        title={id ? t('inventory.editTitle') : t('inventory.newTitle')}
        action={
          id ? (
            <button
              type="button"
              onClick={() => nav(`/inventory/${id}/adjust`)}
              className="tap flex items-center gap-1 rounded-xl px-2 text-sm font-bold text-primary"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t('inventory.adjust')}
            </button>
          ) : undefined
        }
      />
      <div className="space-y-4">
        <div>
          <Label>{t('media.photo')}</Label>
          <PhotoField businessId={business?.id ?? null} value={photoUrl} onChange={setPhotoUrl} />
        </div>
        <div>
          <Label>{t('inventory.nameAr')} *</Label>
          <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} autoFocus required />
        </div>
        <div>
          <Label>{t('inventory.nameEn')}</Label>
          <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" />
        </div>
        <div>
          <Label>{t('inventory.category')}</Label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            list="category-list"
            placeholder={t('inventory.categoryPlaceholder')}
          />
          <datalist id="category-list">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t('inventory.cost')}</Label>
            <Input value={cost} onChange={(e) => setCost(e.target.value)} inputMode="decimal" dir="ltr" />
          </div>
          <div>
            <Label>{t('inventory.sell')}</Label>
            <Input value={sell} onChange={(e) => setSell(e.target.value)} inputMode="decimal" dir="ltr" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setTrack((v) => !v)}
          className="flex w-full items-center justify-between rounded-2xl border border-input bg-card px-4 py-3"
        >
          <span className="font-semibold">{t('inventory.track')}</span>
          <span className={`relative h-7 w-12 rounded-full transition ${track ? 'bg-primary' : 'bg-muted'}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${track ? 'start-6' : 'start-1'}`} />
          </span>
        </button>

        {track && (
          <div className="grid grid-cols-2 gap-3">
            {!id && (
              <div>
                <Label>{t('inventory.stock')}</Label>
                <Input value={stock} onChange={(e) => setStock(e.target.value)} inputMode="decimal" dir="ltr" />
              </div>
            )}
            <div>
              <Label>{t('inventory.minAlert')}</Label>
              <Input value={minAlert} onChange={(e) => setMinAlert(e.target.value)} inputMode="decimal" dir="ltr" />
            </div>
          </div>
        )}
      </div>

      <Button type="submit" size="lg" className="mt-8 w-full" disabled={!nameAr.trim() || save.isPending}>
        {save.isPending ? t('common.loading') : t('inventory.save')}
      </Button>
      {id && (
        <button type="button" onClick={remove} className="mx-auto block py-3 text-sm font-semibold text-destructive">
          {t('common.delete')}
        </button>
      )}
    </form>
  )
}
