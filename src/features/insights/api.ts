import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const VISIT_GAP_DAYS = 75

export interface FollowUp {
  id: string
  name: string
  name_en: string | null
  phone: string | null
  lastVisit: number
  days: number
}

/** Customers whose last job was more than VISIT_GAP_DAYS ago — due for a service reminder. */
export function useFollowUps(businessId: string | null) {
  return useQuery({
    queryKey: ['followups', businessId],
    enabled: !!businessId,
    queryFn: async (): Promise<FollowUp[]> => {
      const [c, j] = await Promise.all([
        supabase.from('customers').select('*'),
        supabase.from('jobs').select('customer_id, created_at'),
      ])
      if (c.error) throw c.error
      if (j.error) throw j.error
      const last = new Map<string, number>()
      for (const job of (j.data ?? []) as { customer_id: string | null; created_at: string }[]) {
        if (!job.customer_id) continue
        const t = new Date(job.created_at).getTime()
        if (t > (last.get(job.customer_id) ?? 0)) last.set(job.customer_id, t)
      }
      const now = Date.now()
      const gap = VISIT_GAP_DAYS * 86_400_000
      return ((c.data ?? []) as unknown as { id: string; name: string; name_en: string | null; phone: string | null }[])
        .map((x) => ({ ...x, lastVisit: last.get(x.id) ?? 0 }))
        .filter((x) => x.lastVisit && now - x.lastVisit >= gap)
        .map((x) => ({ ...x, days: Math.floor((now - x.lastVisit) / 86_400_000) }))
        .sort((a, b) => a.lastVisit - b.lastVisit)
    },
  })
}

export interface UnpaidInvoice {
  id: string
  total: number
  balance: number
  issued_at: string
  invoice_number: string | null
  job?: { customer?: { name: string; name_en: string | null; phone: string | null } | null } | null
}

export function useUnpaid(businessId: string | null) {
  return useQuery({
    queryKey: ['unpaid', businessId],
    enabled: !!businessId,
    queryFn: async (): Promise<UnpaidInvoice[]> => {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, total, balance, issued_at, invoice_number, job:jobs(customer:customers(*))')
        .gt('balance', 0)
        .order('issued_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as UnpaidInvoice[]
    },
  })
}

export function useMarkPaid(businessId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (inv: { id: string; total: number }) => {
      const { error: e1 } = await supabase.from('invoices').update({ paid_amount: inv.total, balance: 0 }).eq('id', inv.id)
      if (e1) throw e1
      const { error: e2 } = await supabase
        .from('payments')
        .insert({ id: crypto.randomUUID(), business_id: businessId, invoice_id: inv.id, amount: inv.total, method: 'cash' })
      if (e2) throw e2
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['unpaid'] })
      void qc.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export interface ProfitLine {
  type: string
  description: string
  quantity: number
  total: number
  inventory?: { cost_price: number } | null
}

export function useProfit(businessId: string | null) {
  return useQuery({
    queryKey: ['profit', businessId],
    enabled: !!businessId,
    queryFn: async (): Promise<ProfitLine[]> => {
      const { data, error } = await supabase
        .from('job_line_items')
        .select('type, description, quantity, total, inventory:inventory_items(cost_price)')
      if (error) throw error
      return (data ?? []) as unknown as ProfitLine[]
    },
  })
}
