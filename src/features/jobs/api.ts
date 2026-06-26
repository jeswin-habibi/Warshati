import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Invoice, Job, JobLineItem, JobStatus, LineItemType } from './types'

const JOB_SELECT = '*, customer:customers(name, phone), vehicle:vehicles(plate_number, make, model)'

export function useJobs(businessId: string | null) {
  return useQuery({
    queryKey: ['jobs', businessId],
    enabled: !!businessId,
    queryFn: async (): Promise<Job[]> => {
      const { data, error } = await supabase.from('jobs').select(JOB_SELECT).order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Job[]
    },
  })
}

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: ['job', id],
    enabled: !!id,
    queryFn: async (): Promise<Job | null> => {
      const { data, error } = await supabase.from('jobs').select(JOB_SELECT).eq('id', id ?? '').maybeSingle()
      if (error) throw error
      return (data as Job | null) ?? null
    },
  })
}

export function useJobLineItems(jobId: string | undefined) {
  return useQuery({
    queryKey: ['job-lines', jobId],
    enabled: !!jobId,
    queryFn: async (): Promise<JobLineItem[]> => {
      const { data, error } = await supabase.from('job_line_items').select('*').eq('job_id', jobId ?? '').order('id')
      if (error) throw error
      return (data ?? []) as JobLineItem[]
    },
  })
}

export function useInvoiceForJob(jobId: string | undefined) {
  return useQuery({
    queryKey: ['invoice', jobId],
    enabled: !!jobId,
    queryFn: async (): Promise<Invoice | null> => {
      const { data, error } = await supabase.from('invoices').select('*').eq('job_id', jobId ?? '').maybeSingle()
      if (error) throw error
      return (data as Invoice | null) ?? null
    },
  })
}

export interface JobInput {
  id?: string
  customer_id?: string | null
  vehicle_id?: string | null
  complaint_text?: string | null
  status?: JobStatus
}

export function useSaveJob(businessId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: JobInput): Promise<string> => {
      if (input.id) {
        const { id, ...patch } = input
        const { error } = await supabase.from('jobs').update(patch).eq('id', id)
        if (error) throw error
        return id
      }
      const id = crypto.randomUUID()
      const { error } = await supabase
        .from('jobs')
        .insert({ ...input, id, business_id: businessId, status: input.status ?? 'estimate' })
      if (error) throw error
      return id
    },
    onSuccess: (_id, vars) => {
      void qc.invalidateQueries({ queryKey: ['jobs'] })
      if (vars.id) void qc.invalidateQueries({ queryKey: ['job', vars.id] })
    },
  })
}

export function useDeleteJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('jobs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export interface LineInput {
  id?: string
  job_id: string
  type: LineItemType
  description: string
  quantity: number
  unit_price: number
  inventory_item_id?: string | null
}

export function useSaveLineItem(businessId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: LineInput) => {
      const total = (input.quantity || 0) * (input.unit_price || 0)
      const fields = {
        type: input.type,
        description: input.description,
        quantity: input.quantity,
        unit_price: input.unit_price,
        total,
        inventory_item_id: input.inventory_item_id ?? null,
      }
      if (input.id) {
        const { error } = await supabase.from('job_line_items').update(fields).eq('id', input.id)
        if (error) throw error
      } else {
        const id = crypto.randomUUID()
        const { error } = await supabase
          .from('job_line_items')
          .insert({ ...fields, id, job_id: input.job_id, business_id: businessId })
        if (error) throw error
      }
    },
    onSuccess: (_v, vars) => void qc.invalidateQueries({ queryKey: ['job-lines', vars.job_id] }),
  })
}

export function useDeleteLineItem(jobId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (lineId: string) => {
      const { error } = await supabase.from('job_line_items').delete().eq('id', lineId)
      if (error) throw error
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['job-lines', jobId] }),
  })
}

export function useCompleteJob(businessId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ jobId, subtotal }: { jobId: string; subtotal: number }) => {
      const { count } = await supabase.from('invoices').select('id', { count: 'exact', head: true })
      const num = `INV-${String((count ?? 0) + 1).padStart(4, '0')}`
      const invId = crypto.randomUUID()
      const { error: e1 } = await supabase.from('invoices').insert({
        id: invId,
        business_id: businessId,
        job_id: jobId,
        invoice_number: num,
        subtotal,
        discount: 0,
        total: subtotal,
        balance: subtotal,
      })
      if (e1) throw e1
      const { error: e2 } = await supabase
        .from('jobs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', jobId)
      if (e2) throw e2

      // Deduct stock for line items linked to a tracked inventory item.
      const { data: lines } = await supabase
        .from('job_line_items')
        .select('inventory_item_id, quantity')
        .eq('job_id', jobId)
        .not('inventory_item_id', 'is', null)
      for (const l of (lines ?? []) as { inventory_item_id: string; quantity: number }[]) {
        const { data: row } = await supabase
          .from('inventory_items')
          .select('id, current_stock, track_stock')
          .eq('id', l.inventory_item_id)
          .maybeSingle()
        const it = row as { id: string; current_stock: number; track_stock: boolean } | null
        if (it && it.track_stock) {
          await supabase.from('inventory_movements').insert({
            id: crypto.randomUUID(), business_id: businessId, item_id: it.id, type: 'out', quantity: l.quantity, reason: 'job',
          })
          await supabase.from('inventory_items').update({ current_stock: Number(it.current_stock) - Number(l.quantity) }).eq('id', it.id)
        }
      }
    },
    onSuccess: (_v, vars) => {
      void qc.invalidateQueries({ queryKey: ['jobs'] })
      void qc.invalidateQueries({ queryKey: ['job', vars.jobId] })
      void qc.invalidateQueries({ queryKey: ['invoice', vars.jobId] })
      void qc.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export interface JobAttachment {
  id: string
  job_id: string
  type: string
  url: string
  caption: string | null
}

export function useJobAttachments(jobId: string | undefined) {
  return useQuery({
    queryKey: ['job-att', jobId],
    enabled: !!jobId,
    queryFn: async (): Promise<JobAttachment[]> => {
      const { data, error } = await supabase.from('job_attachments').select('*').eq('job_id', jobId ?? '').order('created_at')
      if (error) throw error
      return (data ?? []) as JobAttachment[]
    },
  })
}

export function useAddAttachment(jobId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ url, type, businessId }: { url: string; type: string; businessId: string | null }) => {
      const id = crypto.randomUUID()
      const { error } = await supabase.from('job_attachments').insert({ id, job_id: jobId, business_id: businessId, url, type })
      if (error) throw error
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['job-att', jobId] }),
  })
}

export function useDeleteAttachment(jobId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (attId: string) => {
      const { error } = await supabase.from('job_attachments').delete().eq('id', attId)
      if (error) throw error
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['job-att', jobId] }),
  })
}
