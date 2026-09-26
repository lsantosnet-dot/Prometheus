import { AppBar, BottomNavigation, BottomNavigationAction, Box, Container, Toolbar, Typography } from '@mui/material'
import { Assignment, Home, Notifications, PrecisionManufacturing, Sync } from '@mui/icons-material'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ConnectivityBadge } from './ConnectivityBadge'

const navigation = [
  { label: 'Home', path: '/', icon: <Home /> },
  { label: 'Work Orders', path: '/work-orders', icon: <Assignment /> },
  { label: 'Notifications', path: '/notifications', icon: <Notifications /> },
  { label: 'Sync', path: '/synchronization', icon: <Sync /> },
]

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const selected = navigation.find((item) => item.path !== '/' && location.pathname.startsWith(item.path))?.path ?? '/'

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 9 }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ minHeight: 60, gap: 1 }}>
          <PrecisionManufacturing />
          <Typography variant="h3" sx={{ flexGrow: 1, color: '#fff' }}>vallourec maintenance</Typography>
          <ConnectivityBadge />
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="md" sx={{ py: 2.5 }}><Outlet /></Container>
      <BottomNavigation value={selected} onChange={(_, value: string) => navigate(value)} showLabels sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10, borderTop: '1px solid #D9E2EC', height: 68 }}>
        {navigation.map((item) => <BottomNavigationAction key={item.path} label={item.label} value={item.path} icon={item.icon} />)}
      </BottomNavigation>
    </Box>
  )
}