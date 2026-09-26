import { db } from '../db/database'
import type {
  MaintenanceNotification,
  Measurement,
  MeasurementPhoto,
  Priority,
  SyncEntityType,
  SyncQueueEntry,
  WorkOrder,
  WorkOrderStatus,
} from '../domain/models'

const now = () => new Date().toISOString()

function queueEntry(entityType: SyncEntityType, entityId: string, operation: 'create' | 'update'): SyncQueueEntry {
  return {
    id: crypto.randomUUID(), entityType, entityId, operation, status: 'pending', createdAt: now(),
  }
}

export async function saveUser(username: string) {
  await db.users.put({ id: 'current-user', username, updatedAt: now() })
}

export type NewWorkOrder = Pick<WorkOrder, 'description' | 'equipmentId' | 'functionalLocation' | 'priority' | 'plannerGroup' | 'workCenter'>

export async function createWorkOrder(input: NewWorkOrder) {
  const id = crypto.randomUUID()
  const timestamp = now()
  const sequence = (await db.workOrders.count()) + 1001
  const workOrder: WorkOrder = {
    ...input, id, number: `WO-${sequence}`, status: 'Ready', synchronized: false,
    createdAt: timestamp, updatedAt: timestamp,
  }
  await db.transaction('rw', [db.workOrders, db.syncQueue], async () => {
    await db.workOrders.add(workOrder)
    await db.syncQueue.add(queueEntry('workOrder', id, 'create'))
  })
  return workOrder
}

export async function setWorkOrderStatus(id: string, status: WorkOrderStatus) {
  await db.transaction('rw', [db.workOrders, db.syncQueue], async () => {
    await db.workOrders.update(id, { status, synchronized: false, updatedAt: now() })
    await db.syncQueue.add(queueEntry('workOrder', id, 'update'))
  })
}

export interface NewMeasurement {
  workOrderId: string
  measurementPoint: string
  currentValue: number
  unit: string
  comments: string
  photo?: Omit<MeasurementPhoto, 'id' | 'measurementId' | 'createdAt'>
}

export async function createMeasurement(input: NewMeasurement) {
  const { photo, ...measurementInput } = input
  const measurement: Measurement = {
    ...measurementInput, id: crypto.randomUUID(), synchronized: false, createdAt: now(),
  }
  const measurementPhoto: MeasurementPhoto | undefined = photo ? {
    ...photo,
    id: crypto.randomUUID(),
    measurementId: measurement.id,
    createdAt: now(),
  } : undefined
  await db.transaction('rw', [db.measurements, db.measurementPhotos, db.syncQueue], async () => {
    await db.measurements.add(measurement)
    if (measurementPhoto) await db.measurementPhotos.add(measurementPhoto)
    await db.syncQueue.add(queueEntry('measurement', measurement.id, 'create'))
  })
}

export interface NewNotification {
  title: string
  description: string
  equipmentId: string
}

export async function createNotification(input: NewNotification) {
  const notification: MaintenanceNotification = {
    ...input, id: crypto.randomUUID(), synchronized: false, createdAt: now(),
  }
  await db.transaction('rw', [db.notifications, db.syncQueue], async () => {
    await db.notifications.add(notification)
    await db.syncQueue.add(queueEntry('notification', notification.id, 'create'))
  })
}

export async function synchronizePending() {
  const entries = await db.syncQueue.where('status').equals('pending').toArray()
  const counts: Record<SyncEntityType, number> = { workOrder: 0, measurement: 0, notification: 0 }
  await db.transaction('rw', [db.workOrders, db.measurements, db.notifications, db.syncQueue], async () => {
    for (const entry of entries) {
      counts[entry.entityType] += 1
      if (entry.entityType === 'workOrder') await db.workOrders.update(entry.entityId, { synchronized: true })
      if (entry.entityType === 'measurement') await db.measurements.update(entry.entityId, { synchronized: true })
      if (entry.entityType === 'notification') await db.notifications.update(entry.entityId, { synchronized: true })
      await db.syncQueue.update(entry.id, { status: 'synchronized', synchronizedAt: now() })
    }
  })
  return counts
}

export const priorities: Priority[] = ['Low', 'Medium', 'High']