import { useState, type ReactNode } from 'react'
import { Assignment, CloudOff, Notifications, PrecisionManufacturing, Speed, Sync } from '@mui/icons-material'
import { Alert, Box, Button, Card, CardContent, Divider, LinearProgress, Stack, Typography } from '@mui/material'
import { useLiveQuery } from 'dexie-react-hooks'
import { PageHeading } from '../components/Ui'
import { db } from '../db/database'
import type { SyncEntityType } from '../domain/models'
import { useConnectivity } from '../hooks/useConnectivity'
import { downloadEquipment, synchronizePending, type SyncProgress } from '../services/maintenanceService'

const types: { type: SyncEntityType; label: string; icon: ReactNode }[] = [
  { type: 'workOrder', label: 'Work Orders', icon: <Assignment color="secondary" /> },
  { type: 'measurement', label: 'Measurements', icon: <Speed color="secondary" /> },
  { type: 'notification', label: 'Notifications', icon: <Notifications color="warning" /> },
]

type Feedback = { severity: 'success' | 'error'; message: string }

function SyncProgressBar({ progress, downloadingEquipment }: { progress: SyncProgress | null; downloadingEquipment: boolean }) {
  const label = progress?.entityType ? types.find((item) => item.type === progress.entityType)?.label.replace(/s$/, '') : undefined
  const photo = progress?.photoFraction !== undefined ? ` · uploading photo ${Math.round(progress.photoFraction * 100)}%` : ''
  const text = downloadingEquipment ? 'Downloading equipment...' : progress && label ? `Sending ${progress.current} of ${progress.total} · ${label}${photo}` : 'Preparing...'
  const determinate = progress !== null && !downloadingEquipment
  return (
    <Box sx={{ mt: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">{text}</Typography>
        {determinate && <Typography variant="body2" sx={{ fontWeight: 700 }}>{progress.percent}%</Typography>}
      </Box>
      <LinearProgress variant={determinate ? 'determinate' : 'indeterminate'} value={progress?.percent ?? 0} sx={{ height: 8, borderRadius: 4 }} />
    </Box>
  )
}

const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Unexpected error.'

export function SynchronizationPage() {
  const online = useConnectivity()
  const [syncing, setSyncing] = useState(false)
  const [downloadingEquipment, setDownloadingEquipment] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [progress, setProgress] = useState<SyncProgress | null>(null)
  const counts = useLiveQuery(async () => {
    const pending = await db.syncQueue.where('status').equals('pending').toArray()
    return pending.reduce<Record<SyncEntityType, number>>((result, item) => ({ ...result, [item.entityType]: result[item.entityType] + 1 }), { workOrder: 0, measurement: 0, notification: 0 })
  }) ?? { workOrder: 0, measurement: 0, notification: 0 }
  const equipmentCount = useLiveQuery(() => db.equipment.count()) ?? 0

  /** Sends pending changes first, then refreshes the equipment reference data from the backend. */
  async function synchronize() {
    setSyncing(true)
    setFeedback(null)
    setProgress(null)
    try {
      const sent = await synchronizePending(setProgress)
      setDownloadingEquipment(true)
      const equipment = await downloadEquipment()
      setFeedback({ severity: 'success', message: `Synchronization successful: ${sent.workOrder + sent.measurement + sent.notification} change(s) sent, ${equipment} equipment item(s) downloaded.` })
    } catch (error) {
      setFeedback({ severity: 'error', message: errorMessage(error) })
    } finally {
      setSyncing(false)
      setDownloadingEquipment(false)
    }
  }

  return (
    <><PageHeading title="Synchronization" subtitle="Send local changes and download reference data" />
      {!online && <Alert icon={<CloudOff />} severity="warning" sx={{ mb: 2 }}>No network connection detected. Synchronization is not possible right now.</Alert>}
      {feedback && <Alert severity={feedback.severity} onClose={() => setFeedback(null)} sx={{ mb: 2 }}>{feedback.message}</Alert>}
      <Card><CardContent><Typography variant="h2" sx={{ mb: 1 }}>Pending Changes</Typography><Stack divider={<Divider flexItem />}>
        {types.map((item) => <Box key={item.type} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>{item.icon}<Typography sx={{ flex: 1 }}>{item.label}</Typography><Typography variant="h2">{counts[item.type]}</Typography></Box>)}
      </Stack></CardContent></Card>
      <Button fullWidth variant="contained" startIcon={<Sync />} disabled={syncing || !online} onClick={synchronize} sx={{ mt: 2 }}>{syncing ? 'Synchronizing...' : 'Synchronize'}</Button>
      {syncing && <SyncProgressBar progress={progress} downloadingEquipment={downloadingEquipment} />}
      <Card sx={{ mt: 2.5 }}><CardContent><Typography variant="h2" sx={{ mb: 1 }}>Reference Data</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}><PrecisionManufacturing color="secondary" /><Typography sx={{ flex: 1 }}>Equipment</Typography><Typography variant="h2">{equipmentCount}</Typography></Box>
        <Typography variant="body2" color="text.secondary">Downloaded from the backend on every synchronization.</Typography>
      </CardContent></Card>
    </>
  )
}
