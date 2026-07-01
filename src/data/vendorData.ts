import type { Vendor } from '@/types'

export const INITIAL_VENDORS: Vendor[] = [
  { id: 'v1', name: 'Sari Roti Catering', category: 'F&B', arrivalTime: '08:00', status: 'active', assignedArea: 'Food Court', contact: '081234567801' },
  { id: 'v2', name: 'Stage Rigging Co.', category: 'Technical', arrivalTime: '06:00', status: 'completed', assignedArea: 'Main Stage', contact: '081234567802' },
  { id: 'v3', name: 'Nusantara Security Services', category: 'Security', arrivalTime: '07:00', status: 'active', assignedArea: 'All Gates', contact: '081234567803' },
  { id: 'v4', name: 'Pure Water Indonesia', category: 'F&B', arrivalTime: '09:00', status: 'ready', assignedArea: 'Hydration Stations', contact: '081234567804' },
  { id: 'v5', name: 'LiveSound Audio', category: 'Technical', arrivalTime: '05:30', status: 'active', assignedArea: 'Main Stage', contact: '081234567805' },
  { id: 'v6', name: 'Merch Hub Indonesia', category: 'Merchandise', arrivalTime: '10:00', status: 'setup', assignedArea: 'VIP', contact: '081234567806' },
  { id: 'v7', name: 'CleanCity Sanitation', category: 'Facilities', arrivalTime: '06:30', status: 'active', assignedArea: 'Parking', contact: '081234567807' },
  { id: 'v8', name: 'Java Coffee Cart', category: 'F&B', arrivalTime: '11:00', status: 'not_arrived', assignedArea: 'Food Court', contact: '081234567808' },
]

export const VENDOR_CATEGORIES = ['F&B', 'Technical', 'Security', 'Merchandise', 'Facilities']
