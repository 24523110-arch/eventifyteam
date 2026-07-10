// Declarative form schema for every LPJ section. Mirrors the section keys in
// server/src/lpj/registry.js and the data shapes read by the PDF/DOCX
// builders — keep the three in sync when adding a section.

import type { LpjSectionData, UserRole } from '@/types'

export interface LpjField {
  name: string
  label: string
  type: 'text' | 'number' | 'textarea'
  placeholder?: string
}

export interface LpjColumn {
  name: string
  label: string
  type: 'text' | 'number' | 'textarea' | 'select' | 'image'
  options?: string[]
}

export interface LpjTable {
  name: string
  label: string
  columns: LpjColumn[]
}

export interface LpjSectionConfig {
  key: string
  owner: UserRole
  label: string
  hint?: string
  fields?: LpjField[]
  tables?: LpjTable[]
  computed?: (data: LpjSectionData) => { label: string; value: string }[]
}

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0)
const idr = (v: number) => `Rp ${v.toLocaleString('id-ID')}`
type Row = Record<string, unknown>
const rows = (data: LpjSectionData, name: string): Row[] => (Array.isArray(data[name]) ? (data[name] as Row[]) : [])

export const LPJ_SECTION_CONFIGS: LpjSectionConfig[] = [
  {
    key: 'committee',
    owner: 'admin',
    label: 'Struktur Kepanitiaan',
    fields: [
      { name: 'ketua', label: 'Ketua', type: 'text' },
      { name: 'wakil', label: 'Wakil Ketua', type: 'text' },
      { name: 'sekretaris', label: 'Sekretaris', type: 'text' },
      { name: 'bendahara', label: 'Bendahara', type: 'text' },
    ],
    tables: [{
      name: 'divisi',
      label: 'Divisi',
      columns: [
        { name: 'nama', label: 'Nama Divisi', type: 'text' },
        { name: 'koordinator', label: 'Koordinator', type: 'text' },
        { name: 'anggota', label: 'Anggota (pisahkan dengan koma)', type: 'textarea' },
      ],
    }],
  },
  {
    key: 'timeline',
    owner: 'admin',
    label: 'Pelaksanaan Kegiatan',
    hint: 'Susun kronologis: persiapan, sound check, registrasi, opening, penampilan artist, intermission, closing, pembongkaran.',
    tables: [{
      name: 'kegiatan',
      label: 'Timeline Kegiatan',
      columns: [
        { name: 'waktu', label: 'Waktu', type: 'text' },
        { name: 'nama', label: 'Nama Kegiatan', type: 'text' },
        { name: 'deskripsi', label: 'Deskripsi', type: 'textarea' },
      ],
    }],
  },
  {
    key: 'documentation',
    owner: 'admin',
    label: 'Dokumentasi',
    tables: [{
      name: 'dokumentasi',
      label: 'Foto / Video',
      columns: [
        { name: 'kategori', label: 'Kategori', type: 'select', options: ['Persiapan', 'Venue', 'Registrasi', 'Artist', 'Penonton', 'Sponsor', 'Penutupan'] },
        { name: 'caption', label: 'Caption', type: 'text' },
        { name: 'foto', label: 'Foto', type: 'image' },
        { name: 'videoUrl', label: 'Link Video', type: 'text' },
      ],
    }],
  },
  {
    key: 'finance',
    owner: 'admin',
    label: 'Laporan Keuangan',
    tables: [
      {
        name: 'pemasukan',
        label: 'Pemasukan',
        columns: [
          { name: 'sumber', label: 'Sumber', type: 'select', options: ['Penjualan Tiket', 'Sponsor', 'Tenant', 'Merchandise', 'Donasi', 'Lain-lain'] },
          { name: 'jumlah', label: 'Jumlah (Rp)', type: 'number' },
          { name: 'keterangan', label: 'Keterangan', type: 'text' },
        ],
      },
      {
        name: 'pengeluaran',
        label: 'Pengeluaran',
        columns: [
          { name: 'kategori', label: 'Kategori', type: 'select', options: ['Honor Artist', 'Sewa Venue', 'Sound System', 'Lighting', 'LED', 'Vendor', 'Security', 'Konsumsi', 'Dokumentasi', 'Marketing', 'Transportasi', 'Operasional', 'Lain-lain'] },
          { name: 'jumlah', label: 'Jumlah (Rp)', type: 'number' },
          { name: 'keterangan', label: 'Keterangan', type: 'text' },
        ],
      },
    ],
    computed: (data) => {
      const income = rows(data, 'pemasukan').reduce((s, r) => s + num(r.jumlah), 0)
      const expense = rows(data, 'pengeluaran').reduce((s, r) => s + num(r.jumlah), 0)
      const net = income - expense
      return [
        { label: 'Total Pemasukan', value: idr(income) },
        { label: 'Total Pengeluaran', value: idr(expense) },
        { label: net >= 0 ? 'Laba' : 'Rugi', value: idr(Math.abs(net)) },
      ]
    },
  },
  {
    key: 'ticket_sales',
    owner: 'admin',
    label: 'Rekapitulasi Penjualan Tiket',
    tables: [{
      name: 'tiket',
      label: 'Jenis Tiket',
      columns: [
        { name: 'jenis', label: 'Jenis Tiket', type: 'text' },
        { name: 'harga', label: 'Harga (Rp)', type: 'number' },
        { name: 'kuota', label: 'Kuota', type: 'number' },
        { name: 'terjual', label: 'Terjual', type: 'number' },
        { name: 'checkin', label: 'Check-in', type: 'number' },
      ],
    }],
    computed: (data) => {
      const t = rows(data, 'tiket')
      const sold = t.reduce((s, r) => s + num(r.terjual), 0)
      const quota = t.reduce((s, r) => s + num(r.kuota), 0)
      const checkin = t.reduce((s, r) => s + num(r.checkin), 0)
      const revenue = t.reduce((s, r) => s + num(r.harga) * num(r.terjual), 0)
      return [
        { label: 'Ticket Sold', value: sold.toLocaleString('id-ID') },
        { label: 'Ticket Used', value: checkin.toLocaleString('id-ID') },
        { label: 'No Show', value: Math.max(0, sold - checkin).toLocaleString('id-ID') },
        { label: 'Total Revenue', value: idr(revenue) },
        { label: 'Occupancy Rate', value: `${quota > 0 ? Math.round((sold / quota) * 100) : 0}%` },
      ]
    },
  },
  {
    key: 'evaluation',
    owner: 'admin',
    label: 'Evaluasi Pelaksanaan',
    tables: [{
      name: 'evaluasi',
      label: 'Evaluasi',
      columns: [
        { name: 'halBaik', label: 'Hal yang Berjalan Baik', type: 'textarea' },
        { name: 'kendala', label: 'Kendala', type: 'textarea' },
        { name: 'penyebab', label: 'Penyebab', type: 'textarea' },
        { name: 'solusi', label: 'Solusi', type: 'textarea' },
        { name: 'rekomendasi', label: 'Rekomendasi', type: 'textarea' },
      ],
    }],
  },
  {
    key: 'division_evaluation',
    owner: 'admin',
    label: 'Evaluasi Per Divisi',
    tables: [{
      name: 'divisi',
      label: 'Evaluasi Divisi',
      columns: [
        { name: 'divisi', label: 'Divisi', type: 'select', options: ['Acara', 'Operasional', 'Ticketing', 'Sponsorship', 'Publikasi', 'Dokumentasi', 'Logistik', 'Konsumsi'] },
        { name: 'kelebihan', label: 'Kelebihan', type: 'textarea' },
        { name: 'kekurangan', label: 'Kekurangan', type: 'textarea' },
        { name: 'saran', label: 'Saran', type: 'textarea' },
      ],
    }],
  },
  {
    key: 'attendance',
    owner: 'admin',
    label: 'Data Kehadiran',
    fields: [
      { name: 'tiketTerjual', label: 'Total Tiket Terjual', type: 'number' },
      { name: 'hadir', label: 'Total Pengunjung Hadir', type: 'number' },
      { name: 'vip', label: 'VIP', type: 'number' },
      { name: 'guest', label: 'Guest', type: 'number' },
      { name: 'media', label: 'Media', type: 'number' },
      { name: 'crew', label: 'Crew', type: 'number' },
      { name: 'volunteer', label: 'Volunteer', type: 'number' },
    ],
  },
  {
    key: 'media',
    owner: 'admin',
    label: 'Media dan Publikasi',
    fields: [
      { name: 'igReach', label: 'Instagram Reach', type: 'number' },
      { name: 'igImpression', label: 'Instagram Impression', type: 'number' },
      { name: 'tiktokViews', label: 'TikTok Views', type: 'number' },
      { name: 'fbReach', label: 'Facebook Reach', type: 'number' },
      { name: 'webVisitor', label: 'Website Visitor', type: 'number' },
      { name: 'engagement', label: 'Engagement', type: 'number' },
      { name: 'jumlahPosting', label: 'Jumlah Posting', type: 'number' },
      { name: 'mediaPartner', label: 'Media Partner', type: 'text' },
    ],
    tables: [{
      name: 'screenshot',
      label: 'Screenshot Insight',
      columns: [
        { name: 'gambar', label: 'Screenshot', type: 'image' },
        { name: 'caption', label: 'Caption', type: 'text' },
      ],
    }],
  },
  {
    key: 'sponsors',
    owner: 'admin',
    label: 'Sponsor',
    tables: [{
      name: 'sponsor',
      label: 'Daftar Sponsor',
      columns: [
        { name: 'nama', label: 'Nama Sponsor', type: 'text' },
        { name: 'level', label: 'Level', type: 'select', options: ['Platinum', 'Gold', 'Silver', 'Bronze', 'Media Partner', 'In-kind'] },
        { name: 'nilai', label: 'Nilai (Rp)', type: 'number' },
        { name: 'benefit', label: 'Benefit', type: 'textarea' },
        { name: 'statusBenefit', label: 'Status Benefit', type: 'select', options: ['Terpenuhi', 'Sebagian', 'Belum Terpenuhi'] },
        { name: 'logo', label: 'Logo', type: 'image' },
      ],
    }],
  },
  {
    key: 'vendors',
    owner: 'admin',
    label: 'Vendor',
    tables: [{
      name: 'vendor',
      label: 'Daftar Vendor',
      columns: [
        { name: 'nama', label: 'Nama Vendor', type: 'text' },
        { name: 'jenis', label: 'Jenis Vendor', type: 'text' },
        { name: 'pic', label: 'PIC', type: 'text' },
        { name: 'nilaiKontrak', label: 'Nilai Kontrak (Rp)', type: 'number' },
        { name: 'statusPembayaran', label: 'Status Pembayaran', type: 'select', options: ['Lunas', 'DP', 'Belum Dibayar'] },
        { name: 'evaluasi', label: 'Evaluasi Vendor', type: 'textarea' },
      ],
    }],
  },
  // ---- Security Team ----
  {
    key: 'security_resources',
    owner: 'security',
    label: 'Laporan Keamanan dan Keselamatan',
    fields: [
      { name: 'security', label: 'Jumlah Security', type: 'number' },
      { name: 'polisi', label: 'Jumlah Polisi', type: 'number' },
      { name: 'medis', label: 'Tim Medis', type: 'number' },
      { name: 'ambulans', label: 'Ambulans', type: 'number' },
      { name: 'pos', label: 'Pos Keamanan', type: 'number' },
      { name: 'cctv', label: 'CCTV', type: 'number' },
      { name: 'emergencyExit', label: 'Emergency Exit', type: 'number' },
    ],
  },
  {
    key: 'incidents',
    owner: 'security',
    label: 'Laporan Insiden',
    tables: [{
      name: 'insiden',
      label: 'Insiden',
      columns: [
        { name: 'waktu', label: 'Waktu', type: 'text' },
        { name: 'lokasi', label: 'Lokasi', type: 'text' },
        { name: 'jenis', label: 'Jenis Insiden', type: 'text' },
        { name: 'keparahan', label: 'Tingkat Keparahan', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
        { name: 'kronologi', label: 'Kronologi', type: 'textarea' },
        { name: 'penanganan', label: 'Penanganan', type: 'textarea' },
        { name: 'status', label: 'Status', type: 'select', options: ['Selesai', 'Dalam Penanganan', 'Dirujuk'] },
      ],
    }],
  },
  {
    key: 'security_stats',
    owner: 'security',
    label: 'Statistik Keamanan',
    fields: [
      { name: 'totalInsiden', label: 'Total Insiden', type: 'number' },
      { name: 'medicalCases', label: 'Medical Cases', type: 'number' },
      { name: 'lostFound', label: 'Lost and Found', type: 'number' },
      { name: 'responseTime', label: 'Emergency Response Time', type: 'text', placeholder: 'mis. 5 menit' },
    ],
    tables: [{
      name: 'bukti',
      label: 'Foto Bukti / Dokumen Pendukung',
      columns: [
        { name: 'gambar', label: 'Foto', type: 'image' },
        { name: 'caption', label: 'Keterangan', type: 'text' },
      ],
    }],
  },
]

export const SECTION_CONFIG_BY_KEY = Object.fromEntries(LPJ_SECTION_CONFIGS.map((c) => [c.key, c]))
