import { useState } from 'react'
import { DeleteOutlined } from '@mui/icons-material'
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, MenuItem, TextField, Typography } from '@mui/material'
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

/** Trash icon that asks for confirmation before running a local delete. */
export function DeleteButton({ title, message, onConfirm }: { title: string; message: string; onConfirm: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function confirm() {
    setDeleting(true)
    try {
      await onConfirm()
    } finally {
      setDeleting(false)
      setOpen(false)
    }
  }

  return (
    <>
      <IconButton aria-label={title} color="error" onClick={() => setOpen(true)}><DeleteOutlined /></IconButton>
      <Dialog open={open} onClose={() => !deleting && setOpen(false)}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent><DialogContentText>{message}</DialogContentText></DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)} disabled={deleting}>Cancel</Button><Button color="error" variant="contained" onClick={confirm} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button></DialogActions>
      </Dialog>
    </>
  )
}
