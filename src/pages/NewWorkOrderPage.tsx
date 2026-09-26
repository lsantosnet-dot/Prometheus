import { useState, type FormEvent } from 'react'
import { Button, MenuItem, Stack, TextField } from '@mui/material'
import { Save } from '@mui/icons-material'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { EquipmentSelect, PageHeading } from '../components/Ui'
import { db } from '../db/database'
import type { Priority } from '../domain/models'
import { createWorkOrder, priorities } from '../services/maintenanceService'

export function NewWorkOrderPage() {
  const navigate = useNavigate()
  const equipment = useLiveQuery(() => db.equipment.toArray()) ?? []
  const [form, setForm] = useState({ description: '', equipmentId: '', functionalLocation: '', priority: 'Medium' as Priority, plannerGroup: '', workCenter: '' })
  const set = (name: string, value: string) => setForm((current) => ({ ...current, [name]: value }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    await createWorkOrder(form)
    navigate('/work-orders')
  }

  return (
    <form onSubmit={submit}><PageHeading title="New Work Order" subtitle="Create and save locally" /><Stack spacing={2}>
      <TextField label="Description" value={form.description} onChange={(event) => set('description', event.target.value)} required fullWidth />
      <EquipmentSelect equipment={equipment} value={form.equipmentId} onChange={(event) => { const id = event.target.value; const selected = equipment.find((item) => item.id === id); setForm((current) => ({ ...current, equipmentId: id, functionalLocation: selected?.functionalLocation ?? '' })) }} />
      <TextField label="Functional Location" value={form.functionalLocation} onChange={(event) => set('functionalLocation', event.target.value)} required fullWidth />
      <TextField select label="Priority" value={form.priority} onChange={(event) => set('priority', event.target.value)}>{priorities.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
      <TextField label="Planner Group" value={form.plannerGroup} onChange={(event) => set('plannerGroup', event.target.value)} required fullWidth />
      <TextField label="Work Center" value={form.workCenter} onChange={(event) => set('workCenter', event.target.value)} required fullWidth />
      <Button type="submit" variant="contained" startIcon={<Save />}>Save Offline</Button><Button onClick={() => navigate('/work-orders')}>Cancel</Button>
    </Stack></form>
  )
}