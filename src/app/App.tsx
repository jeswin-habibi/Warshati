import { type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSession } from '@/app/session'
import { useBusiness } from '@/features/businesses/useBusiness'
import { Spinner } from '@/components/ui/spinner'
import { AppShell } from '@/components/AppShell'
import LoginPage from '@/features/auth/LoginPage'
import OnboardingWizard from '@/features/onboarding/OnboardingWizard'
import HomePage from '@/features/dashboard/HomePage'
import CustomersPage from '@/features/customers/CustomersPage'
import CustomerForm from '@/features/customers/CustomerForm'
import CustomerDetailPage from '@/features/customers/CustomerDetailPage'
import VehicleForm from '@/features/customers/VehicleForm'
import JobsPage from '@/features/jobs/JobsPage'
import JobForm from '@/features/jobs/JobForm'
import JobDetailPage from '@/features/jobs/JobDetailPage'
import LineItemForm from '@/features/jobs/LineItemForm'
import InventoryPage from '@/features/inventory/InventoryPage'
import ItemForm from '@/features/inventory/ItemForm'
import AdjustStock from '@/features/inventory/AdjustStock'
import MorePage from '@/features/more/MorePage'

function FullScreen({ children }: { children: ReactNode }) {
  return <div className="flex min-h-[100svh] items-center justify-center">{children}</div>
}

export default function App() {
  const { session, loading } = useSession()

  const business = useBusiness()

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
          <Route path="customers/new" element={<CustomerForm />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="customers/:id/edit" element={<CustomerForm />} />
          <Route path="customers/:id/vehicle/new" element={<VehicleForm />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/new" element={<JobForm />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />
          <Route path="jobs/:id/line/new" element={<LineItemForm />} />
          <Route path="jobs/:id/line/:lineId" element={<LineItemForm />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/new" element={<ItemForm />} />
          <Route path="inventory/:id" element={<ItemForm />} />
          <Route path="inventory/:id/adjust" element={<AdjustStock />} />
          <Route path="more" element={<MorePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
