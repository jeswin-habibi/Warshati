import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useBusiness } from '@/features/businesses/useBusiness'
import { useSaveVehicle } from './api'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function VehicleForm() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { id: customerId } = useParams()
  const { data: business } = useBusiness()
  const save = useSaveVehicle(business?.id ?? null)

  const [plate, setPlate] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [color, setColor] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!customerId) return
    await save.mutateAsync({
      customer_id: customerId,
      plate_number: plate.trim() || null,
      make: make.trim() || null,
      model: model.trim() || null,
      year: year ? Number(year) : null,
      color: color.trim() || null,
    })
    nav(`/customers/${customerId}`, { replace: true })
  }

  return (
    <form onSubmit={submit} className="flex min-h-[70svh] flex-col">
      <ScreenHeader title={t('vehicles.newTitle')} />
      <div className="space-y-4">
        <div>
          <Label>{t('vehicles.plate')}</Label>
          <Input value={plate} onChange={(e) => setPlate(e.target.value)} autoFocus dir="ltr" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t('vehicles.make')}</Label>
            <Input value={make} onChange={(e) => setMake(e.target.value)} />
          </div>
          <div>
            <Label>{t('vehicles.model')}</Label>
            <Input value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t('vehicles.year')}</Label>
            <Input value={year} onChange={(e) => setYear(e.target.value)} inputMode="numeric" dir="ltr" />
          </div>
          <div>
            <Label>{t('vehicles.color')}</Label>
            <Input value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
        </div>
      </div>
      <Button type="submit" size="lg" className="mt-8 w-full" disabled={save.isPending}>
        {save.isPending ? t('common.loading') : t('vehicles.save')}
      </Button>
    </form>
  )
}
