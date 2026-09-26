import { useState } from 'react'
import { Alert, Button, Stack, TextField } from '@mui/material'
import { Save } from '@mui/icons-material'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { EquipmentSelect, PageHeading } from '../components/Ui'
import { db } from '../db/database'
import { useFormSubmit } from '../hooks/useFormSubmit'
import { createNotification } from '../services/maintenanceService'

export function NewNotificationPage() {
  const navigate = useNavigate()
  const equipment = useLiveQuery(() => db.equipment.toArray()) ?? []
  const [form, setForm] = useState({ title: '', description: '', equipmentId: '' })
  const set = (name: string, value: string) => setForm((current) => ({ ...current, [name]: value }))

  const { onSubmit, saving, error } = useFormSubmit(async () => {
    await createNotification(form)
    navigate('/notifications', { replace: true })
  })

  return (
    <form onSubmit={onSubmit}><PageHeading title="New Notification" subtitle="Report an issue locally" /><Stack spacing={2}>
      <TextField label="Title" value={form.title} onChange={(event) => set('title', event.target.value)} required />
      <TextField label="Description" value={form.description} onChange={(event) => set('description', event.target.value)} multiline minRows={4} required />
      <EquipmentSelect equipment={equipment} value={form.equipmentId} onChange={(event) => set('equipmentId', event.target.value)} />
      {error && <Alert severity="error">{error}</Alert>}
      <Button type="submit" variant="contained" startIcon={<Save />} disabled={saving}>{saving ? 'Saving...' : 'Save Offline'}</Button><Button onClick={() => navigate('/notifications')}>Cancel</Button>
    </Stack></form>
  )
}