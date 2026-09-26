import { Add, NotificationsActive } from '@mui/icons-material'
import { Box, Card, CardContent, Fab, Stack, Typography } from '@mui/material'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { DeleteButton, PageHeading } from '../components/Ui'
import { db } from '../db/database'
import { deleteNotification } from '../services/maintenanceService'

export function NotificationsPage() {
  const navigate = useNavigate()
  const rows = useLiveQuery(async () => {
    const [notifications, equipment] = await Promise.all([db.notifications.orderBy('createdAt').reverse().toArray(), db.equipment.toArray()])
    const equipmentById = new Map(equipment.map((item) => [item.id, item]))
    return notifications.map((item) => ({ ...item, equipment: equipmentById.get(item.equipmentId) }))
  }) ?? []

  return (
    <>
      <PageHeading title="Notifications" subtitle={`${rows.length} locally available`} />
      <Stack spacing={1.25}>{rows.map((item) => (
        <Card key={item.id}><CardContent sx={{ display: 'flex', gap: 1.5 }}><NotificationsActive color="warning" /><Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="h3">{item.title}</Typography><Typography color="text.secondary" variant="body2">{item.description}</Typography><Typography color="secondary" variant="caption">{item.equipment?.code} - {item.equipment?.name}</Typography></Box><Box sx={{ mt: -1, mr: -1 }}><DeleteButton title="Delete notification" message={`Delete "${item.title}"?`} onConfirm={() => deleteNotification(item.id)} /></Box></CardContent></Card>
      ))}</Stack>
      <Fab color="secondary" variant="extended" onClick={() => navigate('/notifications/new')} sx={{ position: 'fixed', right: 20, bottom: 84 }}><Add sx={{ mr: 1 }} />New Notification</Fab>
    </>
  )
}