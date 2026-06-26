import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { InventoryItem } from './types'

export function useItems(businessId: string | null) {
  return useQuery({
    queryKey: ['items', businessId],
    enabled: !!businessId,
    queryFn: async (): Promise<InventoryItem[]> => {
      const { data, error } = await supabase.from('inventory_items').select('*').order('name_ar')
      if (error) throw error
      return (data ?? []) as InventoryItem[]
    },
  })
}

export function useItem(id: string | undefined) {
  return useQuery({
    queryKey: ['item', id],
    enabled: !!id,
    queryFn: async (): Promise<InventoryItem | null> => {
      const { data, error } = await supabase.from('inventory_items').select('*').eq('id', id ?? '').maybeSingle()
      if (error) throw error
      return (data as InventoryItem | null) ?? null
    },
  })
}

export interface ItemInput {
  id?: string
  name_ar: string
  name_en?: string | null
  cost_price: number
  sell_price: number
  current_stock?: number
  min_stock_alert?: number | null
  track_stock: boolean
  photo_url?: string | null
  category?: string | null
}

export function useSaveItem(businessId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ItemInput) => {
      const base = {
        name_ar: input.name_ar,
        name_en: input.name_en ?? null,
        cost_price: input.cost_price,
        sell_price: input.sell_price,
        min_stock_alert: input.min_stock_alert ?? null,
        track_stock: input.track_stock,
        photo_url: input.photo_url ?? null,
        category: input.category?.trim() || null,
      }
      if (input.id) {
        const { error } = await supabase.from('inventory_items').update(base).eq('id', input.id)
        if (error) throw error
      } else {
        const id = crypto.randomUUID()
        const { error } = await supabase
          .from('inventory_items')
          .insert({ ...base, id, business_id: businessId, current_stock: input.current_stock ?? 0 })
        if (error) throw error
      }
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['items'] }),
  })
}

export function useDeleteItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inventory_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['items'] }),
  })
}

export function useAdjustStock(businessId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ item, delta, reason }: { item: InventoryItem; delta: number; reason: string }) => {
      const movId = crypto.randomUUID()
      const { error: e1 } = await supabase.from('inventory_movements').insert({
        id: movId,
        business_id: businessId,
        item_id: item.id,
        type: delta >= 0 ? 'in' : 'out',
        quantity: Math.abs(delta),
        reason,
      })
      if (e1) throw e1
      const { error: e2 } = await supabase
        .from('inventory_items')
        .update({ current_stock: Number(item.current_stock) + delta })
        .eq('id', item.id)
      if (e2) throw e2
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['items'] })
      void qc.invalidateQueries({ queryKey: ['item'] })
    },
  })
}
