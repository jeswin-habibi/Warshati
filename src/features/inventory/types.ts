export interface InventoryItem {
  id: string
  business_id: string
  name_ar: string
  name_en: string | null
  sku: string | null
  category: string | null
  current_stock: number
  min_stock_alert: number | null
  cost_price: number
  sell_price: number
  track_stock: boolean
  has_expiry: boolean
  photo_url: string | null
  created_at: string
}
