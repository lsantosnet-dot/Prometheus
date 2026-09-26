import { db } from './database'
import type { Equipment, MaintenanceNotification, WorkOrder } from '../domain/models'

const equipment: Equipment[] = [
  { id: 'eq-pump-1001', code: 'PUMP-1001', name: 'Feed Water Pump', functionalLocation: 'PLT-AREA-A' },
  { id: 'eq-pump-2002', code: 'PUMP-2002', name: 'Cooling Pump', functionalLocation: 'PLT-AREA-B' },
  { id: 'eq-mtr-3001', code: 'MTR-3001', name: 'Main Drive Motor', functionalLocation: 'PLT-AREA-C' },
]

const now = new Date().toISOString()

const workOrders: WorkOrder[] = [
  {
    id: 'wo-1001', number: 'WO-1001', description: 'Pump Inspection', equipmentId: 'eq-pump-1001',
    functionalLocation: 'PLT-AREA-A', priority: 'High', plannerGroup: 'MECH-01', workCenter: 'WC-MAINT',
    status: 'Ready', synchronized: true, createdAt: now, updatedAt: now,
  },
  {
    id: 'wo-1002', number: 'WO-1002', description: 'Lubrication Route', equipmentId: 'eq-pump-2002',
    functionalLocation: 'PLT-AREA-B', priority: 'Medium', plannerGroup: 'MECH-01', workCenter: 'WC-MAINT',
    status: 'Ready', synchronized: true, createdAt: now, updatedAt: now,
  },
  {
    id: 'wo-1003', number: 'WO-1003', description: 'Vibration Analysis', equipmentId: 'eq-mtr-3001',
    functionalLocation: 'PLT-AREA-C', priority: 'Low', plannerGroup: 'ELEC-02', workCenter: 'WC-RELIAB',
    status: 'In Progress', synchronized: true, createdAt: now, updatedAt: now,
  },
]

const notifications: MaintenanceNotification[] = [
  {
    id: 'notification-seed-1', title: 'Seal inspection due', description: 'Inspect pump seal during the next intervention.',
    equipmentId: 'eq-pump-1001', synchronized: true, createdAt: now,
  },
]

export async function seedDatabase() {
  await db.transaction('rw', [db.equipment, db.workOrders, db.notifications], async () => {
    if ((await db.equipment.count()) === 0) await db.equipment.bulkAdd(equipment)
    if ((await db.workOrders.count()) === 0) await db.workOrders.bulkAdd(workOrders)
    if ((await db.notifications.count()) === 0) await db.notifications.bulkAdd(notifications)
  })
}