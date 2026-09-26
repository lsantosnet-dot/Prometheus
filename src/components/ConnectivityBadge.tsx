import { Chip } from '@mui/material'
import { CloudDone, CloudOff } from '@mui/icons-material'
import { useConnectivity } from '../hooks/useConnectivity'

export function ConnectivityBadge() {
  const online = useConnectivity()
  return (
    <Chip
      aria-live="polite"
      color={online ? 'success' : 'default'}
      icon={online ? <CloudDone /> : <CloudOff />}
      label={online ? 'ONLINE' : 'OFFLINE'}
      size="small"
      sx={{ color: online ? '#fff' : '#334E68', bgcolor: online ? undefined : '#E2E8F0', fontWeight: 700 }}
    />
  )
}