import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Customer, Vehicle } from './types'

export function useCustomers(businessId: string | null) {
  return useQuery({
    queryKey: ['customers', businessId],
    enabled: !!businessId,
    queryFn: async (): Promise<Customer[]> => {
      const { data, error } = await supabase
        .from('customers')
        .select('*, vehicles(id, plate_number)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Customer[]
    },
  })
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ['customer', id],
    enabled: !!id,
    queryFn: async (): Promise<Customer | null> => {
      const { data, error } = await supabase.from('customers').select('*').eq('id', id ?? '').maybeSingle()
      if (error) throw error
      return (data as Customer | null) ?? null
    },
  })
}

export function useVehicles(customerId: string | undefined) {
  return useQuery({
    queryKey: ['vehicles', customerId],
    enabled: !!customerId,
    queryFn: async (): Promise<Vehicle[]> => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('customer_id', customerId ?? '')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Vehicle[]
    },
  })
}

export interface CustomerInput {
  id?: string
  name: string
  name_en?: string | null
  phone?: string | null
  alt_phone?: string | null
  civil_id?: string | null
  notes?: string | null
  voice_note_url?: string | null
}

export function useSaveCustomer(businessId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CustomerInput): Promise<string> => {
      if (input.id) {
        const { id, ...patch } = input
        const { error } = await supabase.from('customers').update(patch).eq('id', id)
        if (error) throw error
        return id
      }
      const id = crypto.randomUUID()
      const { error } = await supabase.from('customers').insert({ ...input, id, business_id: businessId })
      if (error) throw error
      return id
    },
    onSuccess: (_id, vars) => {
      void qc.invalidateQueries({ queryKey: ['customers'] })
      if (vars.id) void qc.invalidateQueries({ queryKey: ['customer', vars.id] })
    },
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}

export interface VehicleInput {
  customer_id: string
  plate_number?: string | null
  make?: string | null
  model?: string | null
  year?: number | null
  color?: string | null
  notes?: string | null
}

export function useSaveVehicle(businessId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: VehicleInput): Promise<void> => {
      const id = crypto.randomUUID()
      const { error } = await supabase.from('vehicles').insert({ ...input, id, business_id: businessId })
      if (error) throw error
    },
    onSuccess: (_v, vars) => {
      void qc.invalidateQueries({ queryKey: ['vehicles', vars.customer_id] })
      void qc.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}
