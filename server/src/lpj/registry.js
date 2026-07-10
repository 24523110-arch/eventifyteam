// Single source of truth for the LPJ's collaborative sections: which
// sections exist, who owns (may edit) each one, and how they're grouped on
// the Manager's review dashboard. The frontend mirrors these keys in
// src/modules/lpj/sectionConfig.ts — keep both lists in sync.

export const LPJ_SECTIONS = [
  // Admin / Event Organizer
  { key: 'committee', label: 'Struktur Kepanitiaan', owner: 'admin', group: 'Admin Report' },
  { key: 'timeline', label: 'Pelaksanaan Kegiatan', owner: 'admin', group: 'Admin Report' },
  { key: 'documentation', label: 'Dokumentasi', owner: 'admin', group: 'Admin Report' },
  { key: 'finance', label: 'Laporan Keuangan', owner: 'admin', group: 'Finance Report' },
  { key: 'ticket_sales', label: 'Rekapitulasi Penjualan Tiket', owner: 'admin', group: 'Ticket Report' },
  { key: 'evaluation', label: 'Evaluasi Pelaksanaan', owner: 'admin', group: 'Admin Report' },
  { key: 'division_evaluation', label: 'Evaluasi Per Divisi', owner: 'admin', group: 'Admin Report' },
  { key: 'attendance', label: 'Data Kehadiran', owner: 'admin', group: 'Ticket Report' },
  { key: 'media', label: 'Media dan Publikasi', owner: 'admin', group: 'Admin Report' },
  { key: 'sponsors', label: 'Sponsor', owner: 'admin', group: 'Sponsor Report' },
  { key: 'vendors', label: 'Vendor', owner: 'admin', group: 'Vendor Report' },
  // Security Team
  { key: 'security_resources', label: 'Laporan Keamanan dan Keselamatan', owner: 'security', group: 'Security Report' },
  { key: 'incidents', label: 'Laporan Insiden', owner: 'security', group: 'Security Report' },
  { key: 'security_stats', label: 'Statistik Keamanan', owner: 'security', group: 'Security Report' },
]

export const SECTION_BY_KEY = Object.fromEntries(LPJ_SECTIONS.map((s) => [s.key, s]))
