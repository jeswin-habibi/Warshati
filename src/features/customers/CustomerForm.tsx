import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useBusiness } from '@/features/businesses/useBusiness'
import { useCustomer, useSaveCustomer } from './api'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { VoiceNote } from '@/components/VoiceNote'

export default function CustomerForm() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { id } = useParams()
  const { data: business } = useBusiness()
  const existing = useCustomer(id)
  const save = useSaveCustomer(business?.id ?? null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [altPhone, setAltPhone] = useState('')
  const [civilId, setCivilId] = useState('')
  const [notes, setNotes] = useState('')
  const [voiceNote, setVoiceNote] = useState<string | null>(null)

  useEffect(() => {
    const c = existing.data
    if (!c) return
    setName(c.name ?? '')
    setPhone(c.phone ?? '')
    setAltPhone(c.alt_phone ?? '')
    setCivilId(c.civil_id ?? '')
    setNotes(c.notes ?? '')
    setVoiceNote(c.voice_note_url ?? null)
  }, [existing.data])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await save.mutateAsync({
      id,
      name: name.trim(),
      phone: phone.trim() || null,
      alt_phone: altPhone.trim() || null,
      civil_id: civilId.trim() || null,
      notes: notes.trim() || null,
      voice_note_url: voiceNote,
    })
    nav(id ? `/customers/${id}` : '/customers', { replace: true })
  }

  if (id && existing.isLoading) return <div className="flex justify-center py-16"><Spinner /></div>

  return (
    <form onSubmit={submit} className="flex min-h-[70svh] flex-col">
      <ScreenHeader title={id ? t('customers.editTitle') : t('customers.newTitle')} />
      <div className="space-y-4">
        <div>
          <Label>{t('customers.name')} *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
        </div>
        <div>
          <Label>{t('customers.phone')}</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" dir="ltr" />
        </div>
        <div>
          <Label>{t('customers.altPhone')}</Label>
          <Input value={altPhone} onChange={(e) => setAltPhone(e.target.value)} type="tel" inputMode="tel" dir="ltr" />
        </div>
        <div>
          <Label>{t('customers.civilId')}</Label>
          <Input value={civilId} onChange={(e) => setCivilId(e.target.value)} inputMode="numeric" dir="ltr" />
        </div>
        <div>
          <Label>{t('customers.notes')}</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div>
          <Label>{t('media.voiceNote')}</Label>
          <VoiceNote businessId={business?.id ?? null} value={voiceNote} onChange={setVoiceNote} />
        </div>
      </div>
      <Button type="submit" size="lg" className="mt-8 w-full" disabled={!name.trim() || save.isPending}>
        {save.isPending ? t('common.loading') : t('customers.save')}
      </Button>
    </form>
  )
}
