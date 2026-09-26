import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { AddAPhoto, Delete, Save } from '@mui/icons-material'
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeading } from '../components/Ui'
import { createMeasurement } from '../services/maintenanceService'
import { prepareMeasurementPhoto, type PreparedMeasurementPhoto } from '../services/imageService'

export function MeasurementPage() {
  const { workOrderId = '' } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ measurementPoint: '', currentValue: '', unit: '', comments: '' })
  const [photo, setPhoto] = useState<PreparedMeasurementPhoto | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [processingPhoto, setProcessingPhoto] = useState(false)
  const set = (name: string, value: string) => setForm((current) => ({ ...current, [name]: value }))

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  async function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setPhotoError('Select a valid image file.')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      setPhotoError('The original image must be 15 MB or smaller.')
      return
    }
    setPhotoError('')
    setProcessingPhoto(true)
    try {
      const prepared = await prepareMeasurementPhoto(file)
      setPhoto(prepared)
      setPreviewUrl(URL.createObjectURL(prepared.blob))
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'The image could not be processed.')
    } finally {
      setProcessingPhoto(false)
    }
  }

  function removePhoto() {
    setPhoto(null)
    setPreviewUrl(null)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    await createMeasurement({ ...form, workOrderId, currentValue: Number(form.currentValue), photo: photo ?? undefined })
    navigate(`/work-orders/${workOrderId}`)
  }

  return (
    <form onSubmit={submit}><PageHeading title="Record Measurement" subtitle="Stored locally until synchronization" /><Stack spacing={2}>
      <TextField label="Measurement Point" value={form.measurementPoint} onChange={(event) => set('measurementPoint', event.target.value)} required />
      <TextField label="Current Value" type="number" value={form.currentValue} onChange={(event) => set('currentValue', event.target.value)} slotProps={{ htmlInput: { step: 'any' } }} required />
      <TextField label="Unit" value={form.unit} onChange={(event) => set('unit', event.target.value)} required />
      <TextField label="Comments" value={form.comments} onChange={(event) => set('comments', event.target.value)} multiline minRows={3} />
      <Box sx={{ border: '1px dashed #9FB3C8', bgcolor: '#fff', p: 2, textAlign: 'center', borderRadius: 1 }}>
        {previewUrl ? <Box component="img" src={previewUrl} alt="Measurement preview" sx={{ display: 'block', width: '100%', maxHeight: 320, objectFit: 'contain', mb: 1.5 }} /> : <AddAPhoto color="action" sx={{ fontSize: 42, mb: 1 }} />}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'center' }}>
          <Button component="label" variant="outlined" startIcon={<AddAPhoto />} disabled={processingPhoto}>
            {processingPhoto ? 'Processing...' : photo ? 'Replace Photo' : 'Take or Choose Photo'}
            <input hidden type="file" accept="image/*" capture="environment" onChange={selectPhoto} />
          </Button>
          {photo && <Button color="error" startIcon={<Delete />} onClick={removePhoto}>Remove</Button>}
        </Stack>
        {photo && <Typography variant="caption" color="text.secondary">JPEG · {photo.width}x{photo.height} · {Math.ceil(photo.size / 1024)} KB</Typography>}
      </Box>
      {photoError && <Alert severity="error">{photoError}</Alert>}
      <Button type="submit" variant="contained" startIcon={<Save />} disabled={processingPhoto}>Save Offline</Button>
    </Stack></form>
  )
}