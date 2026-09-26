import Dexie, { type EntityTable } from 'dexie'
import type {
  Equipment,
  MaintenanceNotification,
  Measurement,
  MeasurementPhoto,
  SyncQueueEntry,
  User,
  WorkOrder,
} from '../domain/models'

class MaintenanceDatabase extends Dexie {
  users!: EntityTable<User, 'id'>
  equipment!: EntityTable<Equipment, 'id'>
  workOrders!: EntityTable<WorkOrder, 'id'>
  measurements!: EntityTable<Measurement, 'id'>
  measurementPhotos!: EntityTable<MeasurementPhoto, 'id'>
  notifications!: EntityTable<MaintenanceNotification, 'id'>
  syncQueue!: EntityTable<SyncQueueEntry, 'id'>

  constructor() {
    super('vallourec-mobile-maintenance')
    this.version(1).stores({
      users: '&id, username',
      equipment: '&id, &code, name',
      workOrders: '&id, &number, equipmentId, status, priority, synchronized, createdAt',
      measurements: '&id, workOrderId, synchronized, createdAt',
      notifications: '&id, equipmentId, synchronized, createdAt',
      syncQueue: '&id, entityType, entityId, status, createdAt',
    })
    this.version(2).stores({
      users: '&id, username',
      equipment: '&id, &code, name',
      workOrders: '&id, &number, equipmentId, status, priority, synchronized, createdAt',
      measurements: '&id, workOrderId, synchronized, createdAt',
      measurementPhotos: '&id, measurementId, createdAt',
      notifications: '&id, equipmentId, synchronized, createdAt',
      syncQueue: '&id, entityType, entityId, status, createdAt',
    })
  }
}

export const db = new MaintenanceDatabase()