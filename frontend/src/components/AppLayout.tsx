import { useState } from 'react'
import { AssignmentRounded, CalendarMonthRounded, DashboardRounded, EventAvailableRounded, GroupsRounded, Inventory2Rounded, LogoutRounded, ManageAccountsRounded, MenuRounded } from '@mui/icons-material'
import { AppBar, Box, Button, Drawer, IconButton, Paper, Stack, Toolbar, Typography } from '@mui/material'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth'

const navigation = [
  { label: 'Kontrolna tabla', path: '/dashboard', icon: <DashboardRounded />, adminOnly: true },
  { label: 'Resursi', path: '/resources', icon: <Inventory2Rounded />, adminOnly: true },
  { label: 'Zadaci', path: '/tasks', icon: <AssignmentRounded /> },
  { label: 'Zaposleni', path: '/employees', icon: <GroupsRounded />, adminOnly: true },
  { label: 'Rezervacije', path: '/reservations', icon: <EventAvailableRounded /> },
  { label: 'Kalendar', path: '/calendar', icon: <CalendarMonthRounded /> },
  { label: 'Korisnički nalozi', path: '/users', icon: <ManageAccountsRounded />, adminOnly: true },
]

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const navContent = <Box className="sidebar-content">
    <Stack spacing={1}>
      {navigation.filter(item => !item.adminOnly || user?.role === 'ADMIN').map((item) => {
        const active = location.pathname.startsWith(item.path)
        return <Button
          key={item.path}
          startIcon={item.icon}
          variant={active ? 'contained' : 'text'}
          className="nav-button"
          onClick={() => { navigate(item.path); setMobileOpen(false) }}
        >{item.label}</Button>
      })}
    </Stack>
  </Box>

  return <Box className="app-shell">
    <AppBar position="static" color="inherit" elevation={0} className="topbar"><Toolbar>
      <IconButton className="mobile-menu-button" aria-label="Otvori navigaciju" onClick={() => setMobileOpen(true)}><MenuRounded /></IconButton>

      <Box sx={{ ml: 1.5, flexGrow: 1 }}><Typography variant="h6">Small Business Manager</Typography></Box>
      <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right', mr: 1.5 }}><Typography variant="body2">{user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.email}</Typography><Typography variant="caption" color="text.secondary">{user?.role === 'ADMIN' ? 'Administrator' : 'Zaposleni'}</Typography></Box>
      <IconButton aria-label="Odjavi se" title="Odjavi se" onClick={() => { logout(); navigate('/login') }}><LogoutRounded /></IconButton>
    </Toolbar></AppBar>
    <Box className="content-layout">
      <Paper component="nav" className="sidebar" elevation={0} square>{navContent}</Paper>
      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} slotProps={{ paper: { sx: { width: 250, p: 2 } } }}>{navContent}</Drawer>
      <Box component="main" className="main-content"><Outlet /></Box>
    </Box>
  </Box>
}
