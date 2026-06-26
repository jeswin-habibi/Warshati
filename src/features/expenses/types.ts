export type ExpenseCategory = 'rent' | 'salary' | 'utilities' | 'supplies' | 'misc' | 'other'

export interface Expense {
  id: string
  business_id: string
  category: string
  amount: number
  description: string | null
  paid_to: string | null
  expense_date: string
  recurring: boolean
  created_at: string
}
