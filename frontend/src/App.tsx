import { lazy, Suspense } from 'react'
import { Box, CircularProgress } from '@mui/material'
import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from './components/AppLayout'
import './App.css'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'))
const TasksPage = lazy(() => import('./pages/TasksPage'))
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

export default function App() {
  return <Suspense fallback={<Box className="page-loading"><CircularProgress /></Box>}><Routes>
    <Route element={<AppLayout />}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="resources" element={<ResourcesPage />} />
      <Route path="tasks" element={<TasksPage />} />
      <Route path="employees" element={<EmployeesPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes></Suspense>
}
