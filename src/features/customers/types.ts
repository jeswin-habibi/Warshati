export interface Customer {
  id: string
  business_id: string
  name: string
  name_en: string | null
  phone: string | null
  alt_phone: string | null
  civil_id: string | null
  notes: string | null
  voice_note_url: string | null
  created_at: string
  vehicles?: { id: string; plate_number: string | null }[]
}

export interface Vehicle {
  id: string
  business_id: string
  customer_id: string
  plate_number: string | null
  make: string | null
  model: string | null
  year: number | null
  color: string | null
  vin: string | null
  mileage_last_seen: number | null
  notes: string | null
  created_at: string
}
