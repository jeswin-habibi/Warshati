import { type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/app/session'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/ui/spinner'
import { AppShell } from '@/components/AppShell'
import LoginPage from '@/features/auth/LoginPage'
import OnboardingWizard from '@/features/onboarding/OnboardingWizard'
import HomePage from '@/features/dashboard/HomePage'
import CustomersPage from '@/features/customers/CustomersPage'
import JobsPage from '@/features/jobs/JobsPage'
import InventoryPage from '@/features/inventory/InventoryPage'
import MorePage from '@/features/more/MorePage'

function FullScreen({ children }: { children: ReactNode }) {
  return <div className="flex min-h-[100svh] items-center justify-center">{children}</div>
}

export default function App() {
  const { session, loading } = useSession()

  // The signed-in user's business (multi-tenant link via business_users).
  const business = useQuery({
    queryKey: ['my-business', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_users')
        .select('business:businesses(*)')
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return (data?.business as unknown) ?? null
    },
  })

  if (loading) return <FullScreen><Spinner /></FullScreen>
  if (!session) return <LoginPage />
  if (business.isLoading) return <FullScreen><Spinner /></FullScreen>
  if (!business.data) return <OnboardingWizard onDone={() => void business.refetch()} />

  return (
    <BrowserRouter basename="/Warshati">
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="more" element={<MorePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
