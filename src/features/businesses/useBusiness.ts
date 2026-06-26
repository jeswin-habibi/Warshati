import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/app/session'

export interface Business {
  id: string
  name: string
  currency: string
  language: string
  address: string | null
  logo_url: string | null
}

/** The signed-in user's business (single source of truth; cached + shared across features). */
export function useBusiness() {
  const { session } = useSession()
  return useQuery({
    queryKey: ['my-business', session?.user.id],
    enabled: !!session,
    queryFn: async (): Promise<Business | null> => {
      const { data, error } = await supabase
        .from('business_users')
        .select('business:businesses(id,name,currency,language,address,logo_url)')
        .limit(1)
        .maybeSingle()
      if (error) throw error
      const biz = (data as { business: Business | null } | null)?.business
      return biz ?? null
    },
  })
}
