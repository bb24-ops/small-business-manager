import { lazy, Suspense } from 'react'
import { Box, CircularProgress } from '@mui/material'
import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from './components/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import { useAuth } from './auth'
import './App.css'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'))
const TasksPage = lazy(() => import('./pages/TasksPage'))
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'))
const ReservationsPage = lazy(() => import('./pages/ReservationsPage'))
const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))

export default function App() {
  const { user } = useAuth()
  return <Suspense fallback={<Box className="page-loading"><CircularProgress /></Box>}><Routes>
    <Route path="login" element={<LoginPage />} />
    <Route element={<ProtectedRoute />}><Route element={<AppLayout />}>
      <Route index element={<Navigate to={user?.role === 'ADMIN' ? "/dashboard" : "/tasks"} replace />} />
      <Route element={<AdminRoute />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
      <Route path="tasks" element={<TasksPage />} />
      <Route path="reservations" element={<ReservationsPage />} />
      <Route path="calendar" element={<CalendarPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route></Route>
  </Routes></Suspense>
}
