import { useState, type ReactNode } from 'react'
import { Assignment, CheckCircle, Notifications, Speed, Sync } from '@mui/icons-material'
import { Alert, Box, Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material'
import { useLiveQuery } from 'dexie-react-hooks'
import { PageHeading } from '../components/Ui'
import { db } from '../db/database'
import type { SyncEntityType } from '../domain/models'
import { synchronizePending } from '../services/maintenanceService'

const types: { type: SyncEntityType; label: string; icon: ReactNode }[] = [
  { type: 'workOrder', label: 'Work Orders', icon: <Assignment color="secondary" /> },
  { type: 'measurement', label: 'Measurements', icon: <Speed color="secondary" /> },
  { type: 'notification', label: 'Notifications', icon: <Notifications color="warning" /> },
]

export function SynchronizationPage() {
  const [syncing, setSyncing] = useState(false)
  const [success, setSuccess] = useState(false)
  const counts = useLiveQuery(async () => {
    const pending = await db.syncQueue.where('status').equals('pending').toArray()
    return pending.reduce<Record<SyncEntityType, number>>((result, item) => ({ ...result, [item.entityType]: result[item.entityType] + 1 }), { workOrder: 0, measurement: 0, notification: 0 })
  }) ?? { workOrder: 0, measurement: 0, notification: 0 }
  const total = counts.workOrder + counts.measurement + counts.notification

  async function synchronize() {
    setSyncing(true)
    await synchronizePending()
    setSyncing(false)
    setSuccess(true)
  }

  return (
    <><PageHeading title="Synchronization" subtitle="Local simulation - no API calls" />
      {success && <Alert icon={<CheckCircle />} severity="success" sx={{ mb: 2 }}>Synchronization Successful</Alert>}
      <Card><CardContent><Typography variant="h2" sx={{ mb: 1 }}>Pending Changes</Typography><Stack divider={<Divider flexItem />}>
        {types.map((item) => <Box key={item.type} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>{item.icon}<Typography sx={{ flex: 1 }}>{item.label}</Typography><Typography variant="h2">{counts[item.type]}</Typography></Box>)}
      </Stack></CardContent></Card>
      <Button fullWidth variant="contained" startIcon={<Sync />} disabled={syncing || total === 0} onClick={synchronize} sx={{ mt: 2 }}>{syncing ? 'Synchronizing...' : 'Synchronize'}</Button>
    </>
  )
}