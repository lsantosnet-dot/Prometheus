import { useState, type FormEvent } from 'react'
import { Box, Button, Card, CardContent, Container, TextField, Typography } from '@mui/material'
import { Login, PrecisionManufacturing } from '@mui/icons-material'
import { Navigate, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ConnectivityBadge } from '../components/ConnectivityBadge'
import { db } from '../db/database'
import { saveUser } from '../services/maintenanceService'

export function LoginPage() {
  const existingUser = useLiveQuery(() => db.users.get('current-user'))
  const navigate = useNavigate()
  const [username, setUsername] = useState('Leonardo')
  const [password, setPassword] = useState('')
  if (existingUser) return <Navigate to="/" replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    await saveUser(username.trim())
    navigate('/')
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}><ConnectivityBadge /></Box>
      <Container maxWidth="xs" sx={{ flex: 1, display: 'grid', alignContent: 'center', pb: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}><PrecisionManufacturing color="secondary" sx={{ fontSize: 54 }} /><Typography variant="h1" color="primary">Vallourec</Typography><Typography variant="h2">Mobile Maintenance</Typography><Typography color="text.secondary">Offline-first POC</Typography></Box>
        <Card><CardContent component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2.25, p: 3 }}>
          <TextField label="Username" value={username} onChange={(event) => setUsername(event.target.value)} required autoComplete="username" />
          <TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
          <Button type="submit" variant="contained" startIcon={<Login />}>Connect</Button>
        </CardContent></Card>
      </Container>
    </Box>
  )
}