import { db } from '../db/database'
import { apiRequest, ensureOnline, postJson, uploadBinary } from './apiClient'
import type {
  Equipment,
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

type PhotoProgress = (fraction: number) => void

export interface SyncProgress {
  /** 1-based position of the entry being sent. */
  current: number
  total: number
  entityType?: SyncEntityType
  /** Upload progress (0..1) of the current measurement photo, when one is being sent. */
  photoFraction?: number
  percent: number
}

async function currentUsername() {
  return (await db.users.get('current-user'))?.username ?? ''
}

async function sendWorkOrder(id: string, createdBy: string) {
  const order = await db.workOrders.get(id)
  if (!order) return
  const { synchronized: _, ...dto } = order
  const result = await postJson<{ number?: string }>('/workorders', { ...dto, createdBy })
  // The server may assign its own number; keep it locally unless another order already uses it.
  const serverNumber = result?.number
  const numberTaken = serverNumber && serverNumber !== order.number && (await db.workOrders.where('number').equals(serverNumber).count()) > 0
  await db.workOrders.update(id, { synchronized: true, ...(serverNumber && !numberTaken ? { number: serverNumber } : {}) })
}

async function sendMeasurement(id: string, createdBy: string, onPhotoProgress?: PhotoProgress) {
  const measurement = await db.measurements.get(id)
  if (!measurement) return
  // The API requires the parent work order to exist; the upsert is idempotent.
  await sendWorkOrder(measurement.workOrderId, createdBy)
  const { synchronized: _, ...dto } = measurement
  await postJson('/measurements', { ...dto, createdBy })
  const photo = await db.measurementPhotos.where('measurementId').equals(id).first()
  if (photo) {
    await uploadBinary(`/measurements/${encodeURIComponent(id)}/photo`, photo.blob, {
      'Content-Type': photo.mimeType,
      'X-Photo-Id': photo.id,
      'X-File-Name': photo.fileName,
      'X-Width': String(photo.width),
      'X-Height': String(photo.height),
    }, onPhotoProgress)
  }
  await db.measurements.update(id, { synchronized: true })
}

async function sendNotification(id: string, createdBy: string) {
  const notification = await db.notifications.get(id)
  if (!notification) return
  const { synchronized: _, ...dto } = notification
  await postJson('/notifications', { ...dto, createdBy })
  await db.notifications.update(id, { synchronized: true })
}

const senders: Record<SyncEntityType, (id: string, createdBy: string, onPhotoProgress?: PhotoProgress) => Promise<void>> = {
  workOrder: sendWorkOrder,
  measurement: sendMeasurement,
  notification: sendNotification,
}

/**
 * Sends pending queue entries to the API in creation order. Stops at the first failure
 * so later changes are never sent before earlier ones; already-sent entries stay synchronized.
 */
export async function synchronizePending(onProgress?: (progress: SyncProgress) => void) {
  ensureOnline()
  const entries = await db.syncQueue.where('status').equals('pending').sortBy('createdAt')
  const createdBy = await currentUsername()
  const counts: Record<SyncEntityType, number> = { workOrder: 0, measurement: 0, notification: 0 }
  for (const [index, entry] of entries.entries()) {
    const report = (photoFraction?: number) => onProgress?.({
      current: index + 1,
      total: entries.length,
      entityType: entry.entityType,
      photoFraction,
      percent: Math.round(((index + (photoFraction ?? 0)) / entries.length) * 100),
    })
    report()
    await senders[entry.entityType](entry.entityId, createdBy, report)
    await db.syncQueue.update(entry.id, { status: 'synchronized', synchronizedAt: now() })
    counts[entry.entityType] += 1
  }
  onProgress?.({ current: entries.length, total: entries.length, percent: 100 })
  return counts
}

// Local-only deletes: records and their queue entries are removed from IndexedDB; nothing is sent to the API.

export async function deleteMeasurement(id: string) {
  await db.transaction('rw', [db.measurements, db.measurementPhotos, db.syncQueue], async () => {
    await db.measurementPhotos.where('measurementId').equals(id).delete()
    await db.syncQueue.where('entityId').equals(id).delete()
    await db.measurements.delete(id)
  })
}

/** Deletes the work order with its measurements, photos and pending queue entries. */
export async function deleteWorkOrder(id: string) {
  await db.transaction('rw', [db.workOrders, db.measurements, db.measurementPhotos, db.syncQueue], async () => {
    const measurementIds = await db.measurements.where('workOrderId').equals(id).primaryKeys()
    await db.measurementPhotos.where('measurementId').anyOf(measurementIds).delete()
    await db.syncQueue.where('entityId').anyOf([id, ...measurementIds]).delete()
    await db.measurements.bulkDelete(measurementIds)
    await db.workOrders.delete(id)
  })
}

export async function deleteNotification(id: string) {
  await db.transaction('rw', [db.notifications, db.syncQueue], async () => {
    await db.syncQueue.where('entityId').equals(id).delete()
    await db.notifications.delete(id)
  })
}

/** Downloads the equipment reference data and upserts it into the local store. */
export async function downloadEquipment() {
  ensureOnline()
  const items = await apiRequest<Equipment[]>('/equipments')
  await db.transaction('rw', db.equipment, async () => {
    for (const item of items) {
      // `code` is unique locally: drop any local record that holds the same code under another id.
      await db.equipment.where('code').equals(item.code).and((existing) => existing.id !== item.id).delete()
      await db.equipment.put(item)
    }
  })
  return items.length
}

export const priorities: Priority[] = ['Low', 'Medium', 'High']