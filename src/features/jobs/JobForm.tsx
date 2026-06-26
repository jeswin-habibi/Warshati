import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useBusiness } from '@/features/businesses/useBusiness'
import { useCustomers, useVehicles } from '@/features/customers/api'
import type { Customer, Vehicle } from '@/features/customers/types'
import { useSaveJob } from './api'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Picker } from '@/components/Picker'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function JobForm() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data: business } = useBusiness()
  const { data: customers } = useCustomers(business?.id ?? null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const { data: vehicles } = useVehicles(customer?.id)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [complaint, setComplaint] = useState('')
  const save = useSaveJob(business?.id ?? null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const id = await save.mutateAsync({
      customer_id: customer?.id ?? null,
      vehicle_id: vehicle?.id ?? null,
      complaint_text: complaint.trim() || null,
      status: 'estimate',
    })
    nav(`/jobs/${id}`, { replace: true })
  }

  return (
    <form onSubmit={submit} className="flex min-h-[70svh] flex-col">
      <ScreenHeader title={t('jobs.newTitle')} />
      <div className="space-y-4">
        <div>
          <Label>{t('jobs.customer')}</Label>
          <Picker<Customer>
            value={customer}
            onChange={(c) => { setCustomer(c); setVehicle(null) }}
            items={customers ?? []}
            getKey={(c) => c.id}
            getLabel={(c) => c.name}
            getSub={(c) => c.phone ?? undefined}
            placeholder={t('jobs.walkIn')}
            searchPlaceholder={t('common.search')}
            allowClear
            clearLabel={t('jobs.walkIn')}
            filter={(c, q) => c.name.toLowerCase().includes(q) || (c.phone ?? '').includes(q)}
          />
        </div>

        {customer && (
          <div>
            <Label>{t('jobs.vehicle')}</Label>
            <Picker<Vehicle>
              value={vehicle}
              onChange={setVehicle}
              items={vehicles ?? []}
              getKey={(v) => v.id}
              getLabel={(v) => v.plate_number || [v.make, v.model].filter(Boolean).join(' ') || '—'}
              getSub={(v) => [v.make, v.model, v.year].filter(Boolean).join(' ') || undefined}
              placeholder="—"
              allowClear
              clearLabel="—"
            />
          </div>
        )}

        <div>
          <Label>{t('jobs.complaint')}</Label>
          <Textarea value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder={t('jobs.complaintPlaceholder')} />
        </div>
      </div>

      <Button type="submit" size="lg" className="mt-8 w-full" disabled={save.isPending}>
        {save.isPending ? t('common.loading') : t('jobs.create')}
      </Button>
    </form>
  )
}
