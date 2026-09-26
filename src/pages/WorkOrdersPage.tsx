import { useDeferredValue, useState } from 'react'
import { Add, ChevronRight, Search } from '@mui/icons-material'
import { Box, Card, CardActionArea, CardContent, Fab, InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { DeleteButton, PageHeading, PriorityChip, StatusChip } from '../components/Ui'
import { db } from '../db/database'
import { deleteWorkOrder } from '../services/maintenanceService'

export function WorkOrdersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.toLowerCase())
  const [status, setStatus] = useState('All')
  const [priority, setPriority] = useState('All')
  const rows = useLiveQuery(async () => {
    const [orders, equipment] = await Promise.all([db.workOrders.toArray(), db.equipment.toArray()])
    const equipmentById = new Map(equipment.map((item) => [item.id, item]))
    return orders.map((order) => ({ ...order, equipment: equipmentById.get(order.equipmentId) }))
  }) ?? []
  const filtered = rows.filter((row) => {
    const text = `${row.number} ${row.description} ${row.equipment?.code} ${row.equipment?.name} ${row.functionalLocation}`.toLowerCase()
    return text.includes(deferredSearch) && (status === 'All' || row.status === status) && (priority === 'All' || row.priority === priority)
  })

  return (
    <>
      <PageHeading title="Work Orders" subtitle={`${filtered.length} locally available`} />
      <TextField fullWidth placeholder="Search work orders" value={search} onChange={(event) => setSearch(event.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> } }} sx={{ mb: 1.5 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
        <TextField select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>{['All', 'Ready', 'In Progress', 'Completed'].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
        <TextField select label="Priority" value={priority} onChange={(event) => setPriority(event.target.value)}>{['All', 'Low', 'Medium', 'High'].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
      </Box>
      <Stack spacing={1.25}>
        {filtered.map((order) => (
          <Card key={order.id} sx={{ display: 'flex', alignItems: 'center' }}><CardActionArea sx={{ flex: 1, minWidth: 0 }} onClick={() => navigate(`/work-orders/${order.id}`)}><CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="caption" color="secondary" sx={{ fontWeight: 700 }}>{order.number}</Typography><Typography variant="h3">{order.description}</Typography><Typography variant="body2" color="text.secondary">{order.equipment?.code} · {order.functionalLocation}</Typography><Stack direction="row" sx={{ gap: 1, mt: 1 }}><StatusChip status={order.status} /><PriorityChip priority={order.priority} /></Stack></Box><ChevronRight color="action" />
          </CardContent></CardActionArea><Box sx={{ pr: 1 }}><DeleteButton title="Delete work order" message={`Delete ${order.number} and all of its measurements and photos? This removes it from this device only; data already sent to the server is kept.`} onConfirm={() => deleteWorkOrder(order.id)} /></Box></Card>
        ))}
        {filtered.length === 0 && <Typography color="text.secondary" sx={{ textAlign: 'center', py: 5 }}>No work orders match these filters.</Typography>}
      </Stack>
      <Fab color="secondary" variant="extended" onClick={() => navigate('/work-orders/new')} sx={{ position: 'fixed', right: 20, bottom: 84 }}><Add sx={{ mr: 1 }} />New Work Order</Fab>
    </>
  )
}