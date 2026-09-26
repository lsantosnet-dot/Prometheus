export type Priority = 'Low' | 'Medium' | 'High'
export type WorkOrderStatus = 'Ready' | 'In Progress' | 'Completed'
export type SyncEntityType = 'workOrder' | 'measurement' | 'notification'

export interface User {
  id: string
  username: string
  updatedAt: string
}

export interface Equipment {
  id: string
  code: string
  name: string
  functionalLocation: string
}

export interface WorkOrder {
  id: string
  number: string
  description: string
  equipmentId: string
  functionalLocation: string
  priority: Priority
  plannerGroup: string
  workCenter: string
  status: WorkOrderStatus
  synchronized: boolean
  createdAt: string
  updatedAt: string
}

export interface Measurement {
  id: string
  workOrderId: string
  measurementPoint: string
  currentValue: number
  unit: string
  comments: string
  synchronized: boolean
  createdAt: string
}

export interface MeasurementPhoto {
  id: string
  measurementId: string
  blob: Blob
  fileName: string
  mimeType: 'image/jpeg'
  width: number
  height: number
  size: number
  createdAt: string
}

export interface MaintenanceNotification {
  id: string
  title: string
  description: string
  equipmentId: string
  synchronized: boolean
  createdAt: string
}

export interface SyncQueueEntry {
  id: string
  entityType: SyncEntityType
  entityId: string
  operation: 'create' | 'update'
  status: 'pending' | 'synchronized'
  createdAt: string
  synchronizedAt?: string
}