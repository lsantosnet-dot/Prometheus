import { Box, CircularProgress } from '@mui/material'
import { useLiveQuery } from 'dexie-react-hooks'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { db } from '../db/database'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { MeasurementPage } from '../pages/MeasurementPage'
import { NewWorkOrderPage } from '../pages/NewWorkOrderPage'
import { NewNotificationPage } from '../pages/NewNotificationPage'
import { NotificationsPage } from '../pages/NotificationsPage'
import { SynchronizationPage } from '../pages/SynchronizationPage'
import { WorkOrderDetailsPage } from '../pages/WorkOrderDetailsPage'
import { WorkOrdersPage } from '../pages/WorkOrdersPage'

function SessionGuard() {
  const user = useLiveQuery(async () => (await db.users.get('current-user')) ?? null)
  if (user === undefined) return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}><CircularProgress /></Box>
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export function AppRouter() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<SessionGuard />}>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="work-orders" element={<WorkOrdersPage />} />
            <Route path="work-orders/new" element={<NewWorkOrderPage />} />
            <Route path="work-orders/:workOrderId" element={<WorkOrderDetailsPage />} />
            <Route path="work-orders/:workOrderId/measurement" element={<MeasurementPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="notifications/new" element={<NewNotificationPage />} />
            <Route path="synchronization" element={<SynchronizationPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}