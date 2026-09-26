import { Box, Chip, MenuItem, TextField, Typography } from '@mui/material'
import type { TextFieldProps } from '@mui/material'
import type { Equipment, Priority, WorkOrderStatus } from '../domain/models'

export function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return <Box sx={{ mb: 2 }}><Typography variant="h1">{title}</Typography>{subtitle && <Typography color="text.secondary">{subtitle}</Typography>}</Box>
}

export function StatusChip({ status }: { status: WorkOrderStatus }) {
  const color = status === 'Completed' ? 'success' : status === 'In Progress' ? 'secondary' : 'warning'
  return <Chip label={status} color={color} size="small" />
}

export function PriorityChip({ priority }: { priority: Priority }) {
  const color = priority === 'High' ? 'error' : priority === 'Medium' ? 'warning' : 'info'
  return <Chip label={priority} color={color} size="small" variant="outlined" />
}

type EquipmentSelectProps = Omit<TextFieldProps, 'select' | 'children'> & { equipment: Equipment[] }

export function EquipmentSelect({ equipment, ...props }: EquipmentSelectProps) {
  return <TextField select label="Equipment" required fullWidth {...props}>{equipment.map((item) => <MenuItem key={item.id} value={item.id}>{item.code} - {item.name}</MenuItem>)}</TextField>
}