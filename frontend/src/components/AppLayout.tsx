import { useState } from 'react'
import { AssignmentRounded, CalendarMonthRounded, DashboardRounded, EventAvailableRounded, GroupsRounded, Inventory2Rounded, MenuRounded } from '@mui/icons-material'
import { AppBar, Box, Button, Chip, Drawer, IconButton, Paper, Stack, Toolbar, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { api } from '../api'

const navigation = [
  { label: 'Kontrolna tabla', path: '/dashboard', icon: <DashboardRounded /> },
  { label: 'Resursi', path: '/resources', icon: <Inventory2Rounded /> },
  { label: 'Zadaci', path: '/tasks', icon: <AssignmentRounded /> },
  { label: 'Zaposleni', path: '/employees', icon: <GroupsRounded /> },
  { label: 'Rezervacije', path: '/reservations', icon: <EventAvailableRounded /> },
  { label: 'Kalendar', path: '/calendar', icon: <CalendarMonthRounded /> },
]

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const healthQuery = useQuery({ queryKey: ['health'], queryFn: api.health, retry: false })

  const navContent = <Box className="sidebar-content">
    <Stack spacing={1}>
      {navigation.map((item) => {
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
      <Box className="brand-mark"><Inventory2Rounded /></Box>
      <Box sx={{ ml: 1.5, flexGrow: 1 }}><Typography variant="h6">Small Business Manager</Typography><Typography variant="caption" color="text.secondary">Upravljanje resursima i obavezama</Typography></Box>
      <Chip size="small" color={healthQuery.isSuccess ? 'success' : 'error'} label={healthQuery.isSuccess ? 'Sistem je dostupan' : 'Backend nije dostupan'} variant="outlined" />
    </Toolbar></AppBar>
    <Box className="content-layout">
      <Paper component="nav" className="sidebar" elevation={0} square>{navContent}</Paper>
      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} slotProps={{ paper: { sx: { width: 250, p: 2 } } }}>{navContent}</Drawer>
      <Box component="main" className="main-content"><Outlet /></Box>
    </Box>
  </Box>
}
