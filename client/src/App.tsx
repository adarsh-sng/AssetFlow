import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { LoginPage } from './pages/Login'
import { SignupPage } from './pages/Signup'
import { DashboardPage } from './pages/Dashboard'
import { OrgSetupPage } from './pages/OrgSetup'
import { AssetsPage } from './pages/Assets'
import { AllocationPage } from './pages/Allocation'
import { BookingPage } from './pages/Booking'
import { MaintenancePage } from './pages/Maintenance'
import { AuditPage } from './pages/Audit'
import { ReportsPage } from './pages/Reports'
import { NotificationsPage } from './pages/Notifications'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="org-setup" element={<OrgSetupPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="allocation" element={<AllocationPage />} />
        <Route path="booking" element={<BookingPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
    </Routes>
  )
}
