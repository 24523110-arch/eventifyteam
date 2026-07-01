import type { AppUser, RoleOption } from '@/types'

export const ROLE_OPTIONS: RoleOption[] = [
  { value: 'manager', label: 'Manager', description: 'Business evaluation, finance & reporting' },
  { value: 'admin', label: 'Admin / Event Organizer', description: 'Tickets, vendors & operations' },
  { value: 'security', label: 'Security Team', description: 'Crowd safety & incident response' },
]

// Dummy credentials for demo login — one account per role
export const MOCK_ACCOUNTS: { email: string; password: string; user: AppUser }[] = [
  {
    email: 'manager@eventify.io',
    password: 'manager123',
    user: {
      id: 'u-001',
      name: 'Raka Pratama',
      email: 'manager@eventify.io',
      role: 'manager',
      avatarInitials: 'RP',
      lastLogin: '19 Jun 2026, 19:42',
      status: 'active',
    },
  },
  {
    email: 'admin@eventify.io',
    password: 'admin123',
    user: {
      id: 'u-002',
      name: 'Dewi Anggraini',
      email: 'admin@eventify.io',
      role: 'admin',
      avatarInitials: 'DA',
      lastLogin: '19 Jun 2026, 18:10',
      status: 'active',
    },
  },
  {
    email: 'security@eventify.io',
    password: 'security123',
    user: {
      id: 'u-003',
      name: 'Andi Wijaya',
      email: 'security@eventify.io',
      role: 'security',
      avatarInitials: 'AW',
      lastLogin: '19 Jun 2026, 19:50',
      status: 'active',
    },
  },
]

// Full user directory for User Management (Manager only)
export const ALL_USERS: AppUser[] = [
  MOCK_ACCOUNTS[0].user,
  MOCK_ACCOUNTS[1].user,
  MOCK_ACCOUNTS[2].user,
  { id: 'u-004', name: 'Maya Kusuma', email: 'maya.k@eventify.io', role: 'manager', avatarInitials: 'MK', lastLogin: '18 Jun 2026, 16:30', status: 'active' },
  { id: 'u-005', name: 'Fajar Nugroho', email: 'fajar.n@eventify.io', role: 'admin', avatarInitials: 'FN', lastLogin: '18 Jun 2026, 17:55', status: 'active' },
  { id: 'u-006', name: 'Budi Santoso', email: 'budi.s@eventify.io', role: 'security', avatarInitials: 'BS', lastLogin: '17 Jun 2026, 15:20', status: 'disabled' },
]
