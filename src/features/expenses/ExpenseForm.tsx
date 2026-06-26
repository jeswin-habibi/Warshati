import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useBusiness } from '@/features/businesses/useBusiness'
import { useExpense, useSaveExpense, useDeleteExpense } from './api'
import type { ExpenseCategory } from './types'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'

const CATS: ExpenseCategory[] = ['rent', 'salary', 'utilities', 'supplies', 'misc', 'other']

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function ExpenseForm() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { id } = useParams()
  const { data: business } = useBusiness()
  const existing = useExpense(id)
  const save = useSaveExpense(business?.id ?? null)
  const del = useDeleteExpense()

  const [category, setCategory] = useState<string>('other')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayStr())
  const [description, setDescription] = useState('')
  const [recurring, setRecurring] = useState(false)

  useEffect(() => {
    const e = existing.data
    if (!e) return
    setCategory(e.category)
    setAmount(String(e.amount ?? ''))
    setDate(e.expense_date)
    setDescription(e.description ?? '')
    setRecurring(e.recurring)
  }, [existing.data])

  async function submit(ev: FormEvent) {
    ev.preventDefault()
    if (!amount) return
    await save.mutateAsync({
      id,
      category,
      amount: Number(amount) || 0,
      description: description.trim() || null,
      expense_date: date,
      recurring,
    })
    nav('/expenses', { replace: true })
  }

  async function remove() {
    if (!id) return
    if (!confirm(t('expenses.deleteConfirm'))) return
    await del.mutateAsync(id)
    nav('/expenses', { replace: true })
  }

  if (id && existing.isLoading) return <div className="flex justify-center py-16"><Spinner /></div>

  return (
    <form onSubmit={submit} className="flex min-h-[70svh] flex-col">
      <ScreenHeader title={id ? t('expenses.editTitle') : t('expenses.newTitle')} />
      <div className="space-y-4">
        <div>
          <Label>{t('expenses.category')}</Label>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATS.map((c) => (
              <option key={c} value={c}>{t(`expenses.cat_${c}`)}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t('expenses.amount')} *</Label>
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" dir="ltr" autoFocus required />
        </div>
        <div>
          <Label>{t('expenses.date')}</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} dir="ltr" />
        </div>
        <div>
          <Label>{t('expenses.note')}</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <button
          type="button"
          onClick={() => setRecurring((v) => !v)}
          className="flex w-full items-center justify-between rounded-2xl border border-input bg-card px-4 py-3"
        >
          <span className="font-semibold">{t('expenses.recurring')}</span>
          <span className={`relative h-7 w-12 rounded-full transition ${recurring ? 'bg-primary' : 'bg-muted'}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${recurring ? 'start-6' : 'start-1'}`} />
          </span>
        </button>
      </div>
      <Button type="submit" size="lg" className="mt-8 w-full" disabled={!amount || save.isPending}>
        {save.isPending ? t('common.loading') : t('common.save')}
      </Button>
      {id && (
        <button type="button" onClick={remove} className="mx-auto block py-3 text-sm font-semibold text-destructive">
          {t('common.delete')}
        </button>
      )}
    </form>
  )
}
