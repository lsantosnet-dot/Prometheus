import { useEffect, useState } from 'react'
import { AssignmentTurnedIn, PhotoCamera, PlayArrow, Speed } from '@mui/icons-material'
import { Box, Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { DeleteButton, PageHeading, PriorityChip, StatusChip } from '../components/Ui'
import { db } from '../db/database'
import { deleteMeasurement, deleteWorkOrder, setWorkOrderStatus } from '../services/maintenanceService'
import type { MeasurementPhoto } from '../domain/models'

function MeasurementPhotoPreview({ photo }: { photo: MeasurementPhoto }) {
  const [url] = useState(() => URL.createObjectURL(photo.blob))
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  return <Box component="img" src={url} alt="Saved measurement" sx={{ width: 88, height: 66, objectFit: 'cover', borderRadius: 1 }} />
}

export function WorkOrderDetailsPage() {
  const { workOrderId = '' } = useParams()
  const navigate = useNavigate()
  const data = useLiveQuery(async () => {
    const order = await db.workOrders.get(workOrderId)
    if (!order) return null
    const measurements = await db.measurements.where('workOrderId').equals(workOrderId).reverse().toArray()
    const measurementPhotos = measurements.length > 0
      ? await db.measurementPhotos.where('measurementId').anyOf(measurements.map((item) => item.id)).toArray()
      : []
    return { order, equipment: await db.equipment.get(order.equipmentId), measurements, measurementPhotos }
  }, [workOrderId])

  if (data === undefined) return <Typography>Loading...</Typography>
  if (!data) return <PageHeading title="Work order not found" />
  const { order, equipment, measurements, measurementPhotos } = data
  const photoByMeasurement = new Map(measurementPhotos.map((photo) => [photo.measurementId, photo]))
  const field = (label: string, value: string) => <Box><Typography variant="caption" color="text.secondary">{label}</Typography><Typography sx={{ fontWeight: 600 }}>{value}</Typography></Box>

  return (
    <><Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}><Box sx={{ flex: 1, minWidth: 0 }}><PageHeading title={order.number} subtitle={order.description} /></Box>
        <DeleteButton title="Delete work order" message={`Delete ${order.number} and all of its measurements and photos? This removes it from this device only; data already sent to the server is kept.`} onConfirm={async () => { await deleteWorkOrder(order.id); navigate('/work-orders', { replace: true }) }} /></Box><Stack direction="row" sx={{ gap: 1, mb: 2 }}><StatusChip status={order.status} /><PriorityChip priority={order.priority} /></Stack>
      <Card><CardContent sx={{ display: 'grid', gap: 1.5 }}>{field('Equipment', `${equipment?.code ?? ''} - ${equipment?.name ?? ''}`)}<Divider />{field('Functional Location', order.functionalLocation)}<Divider />{field('Planner Group', order.plannerGroup)}<Divider />{field('Work Center', order.workCenter)}</CardContent></Card>
      {measurements.length > 0 && <Box sx={{ mt: 2 }}><Typography variant="h2" sx={{ mb: 1 }}>Measurements</Typography><Stack spacing={1}>
        {measurements.map((measurement) => <Card key={measurement.id}><CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {photoByMeasurement.get(measurement.id) ? <MeasurementPhotoPreview photo={photoByMeasurement.get(measurement.id)!} /> : <PhotoCamera color="disabled" />}
          <Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="h3">{measurement.measurementPoint}</Typography><Typography>{measurement.currentValue} {measurement.unit}</Typography>{measurement.comments && <Typography variant="body2" color="text.secondary">{measurement.comments}</Typography>}</Box>
          <DeleteButton title="Delete measurement" message={`Delete measurement "${measurement.measurementPoint}" and its photo? This removes it from this device only; data already sent to the server is kept.`} onConfirm={() => deleteMeasurement(measurement.id)} />
        </CardContent></Card>)}
      </Stack></Box>}
      <Box sx={{ display: 'grid', gap: 1.25, mt: 2 }}>
        <Button variant="contained" startIcon={<PlayArrow />} onClick={() => setWorkOrderStatus(order.id, 'In Progress')}>Start Work</Button>
        <Button variant="outlined" startIcon={<Speed />} onClick={() => navigate(`/work-orders/${order.id}/measurement`)}>Record Measurement</Button>
        <Button color="success" variant="contained" startIcon={<AssignmentTurnedIn />} onClick={() => setWorkOrderStatus(order.id, 'Completed')}>Complete</Button>
      </Box>
    </>
  )
}