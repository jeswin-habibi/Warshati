import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Expense } from './types'

export function useExpenses(businessId: string | null) {
  return useQuery({
    queryKey: ['expenses', businessId],
    enabled: !!businessId,
    queryFn: async (): Promise<Expense[]> => {
      const { data, error } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as Expense[]
    },
  })
}

export function useExpense(id: string | undefined) {
  return useQuery({
    queryKey: ['expense', id],
    enabled: !!id,
    queryFn: async (): Promise<Expense | null> => {
      const { data, error } = await supabase.from('expenses').select('*').eq('id', id ?? '').maybeSingle()
      if (error) throw error
      return (data as Expense | null) ?? null
    },
  })
}

export interface ExpenseInput {
  id?: string
  category: string
  amount: number
  description?: string | null
  paid_to?: string | null
  expense_date: string
  recurring: boolean
}

export function useSaveExpense(businessId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ExpenseInput) => {
      if (input.id) {
        const { id, ...patch } = input
        const { error } = await supabase.from('expenses').update(patch).eq('id', id)
        if (error) throw error
      } else {
        const id = crypto.randomUUID()
        const { error } = await supabase.from('expenses').insert({ ...input, id, business_id: businessId })
        if (error) throw error
      }
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['expenses'] }),
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['expenses'] }),
  })
}
