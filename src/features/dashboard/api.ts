import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface InvoiceRow {
  id: string
  total: number
  balance: number
  issued_at: string
  job?: { customer?: { id: string; name: string; name_en: string | null } | null } | null
}

export function useInvoices(businessId: string | null) {
  return useQuery({
    queryKey: ['invoices', businessId],
    enabled: !!businessId,
    queryFn: async (): Promise<InvoiceRow[]> => {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, total, balance, issued_at, job:jobs(customer:customers(*))')
        .order('issued_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as InvoiceRow[]
    },
  })
}

export interface LineRow {
  description: string
  total: number
  quantity: number
  type: string
  inventory?: { category: string | null } | null
}

export function useLineItems(businessId: string | null) {
  return useQuery({
    queryKey: ['line-items-all', businessId],
    enabled: !!businessId,
    queryFn: async (): Promise<LineRow[]> => {
      const { data, error } = await supabase
        .from('job_line_items')
        .select('description, total, quantity, type, inventory:inventory_items(category)')
      if (error) throw error
      return (data ?? []) as unknown as LineRow[]
    },
  })
}
