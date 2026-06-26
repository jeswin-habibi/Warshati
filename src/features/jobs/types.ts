export type JobStatus = 'estimate' | 'in_progress' | 'completed' | 'cancelled'
export type LineItemType = 'labor' | 'part' | 'service' | 'resale'

export interface Job {
  id: string
  business_id: string
  customer_id: string | null
  vehicle_id: string | null
  status: JobStatus
  complaint_text: string | null
  diagnosis_text: string | null
  mileage_at_visit: number | null
  created_at: string
  completed_at: string | null
  customer?: { name: string; phone: string | null } | null
  vehicle?: { plate_number: string | null; make: string | null; model: string | null } | null
}

export interface JobLineItem {
  id: string
  job_id: string
  business_id: string
  type: LineItemType
  description: string
  quantity: number
  unit_price: number
  total: number
  inventory_item_id: string | null
}

export interface Invoice {
  id: string
  business_id: string
  job_id: string | null
  invoice_number: string | null
  subtotal: number
  discount: number
  total: number
  balance: number
  issued_at: string
}
