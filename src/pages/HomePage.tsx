import { Assignment, CloudDone, Notifications, Sync } from '@mui/icons-material'
import { Box, Button, Card, CardContent, Chip, Typography } from '@mui/material'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { PageHeading } from '../components/Ui'
import { db } from '../db/database'

const cards = [
  { key: 'workOrders', label: 'Work Orders', icon: <Assignment color="secondary" /> },
  { key: 'notifications', label: 'Notifications', icon: <Notifications color="warning" /> },
  { key: 'pending', label: 'Pending Synchronization', icon: <Sync color="secondary" /> },
] as const

export function HomePage() {
  const navigate = useNavigate()
  const dashboard = useLiveQuery(async () => {
    const [user, workOrders, notifications, pending] = await Promise.all([db.users.get('current-user'), db.workOrders.count(), db.notifications.count(), db.syncQueue.where('status').equals('pending').count()])
    return { user, workOrders, notifications, pending }
  })

  return (
    <><PageHeading title={`Welcome, ${dashboard?.user?.username ?? ''}`} subtitle="Your locally available maintenance workspace" /><Chip icon={<CloudDone />} label="OFFLINE READY" color="success" sx={{ mb: 2.5, color: '#fff', fontWeight: 700 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1.5 }}>
        {cards.map((card) => <Card key={card.key}><CardContent>{card.icon}<Typography variant="body2" color="text.secondary">{card.label}</Typography><Typography variant="h1">{dashboard?.[card.key] ?? 0}</Typography></CardContent></Card>)}
        <Card><CardContent><CloudDone color="success" /><Typography variant="body2" color="text.secondary">Offline Mode</Typography><Typography variant="h2">Available</Typography></CardContent></Card>
      </Box>
      <Box sx={{ display: 'grid', gap: 1.25, mt: 2.5 }}><Button variant="contained" startIcon={<Assignment />} onClick={() => navigate('/work-orders')}>Work Orders</Button><Button variant="outlined" startIcon={<Notifications />} onClick={() => navigate('/notifications')}>Notifications</Button><Button variant="outlined" startIcon={<Sync />} onClick={() => navigate('/synchronization')}>Synchronization</Button></Box>
    </>
  )
}