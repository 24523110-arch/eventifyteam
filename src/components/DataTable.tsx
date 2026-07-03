import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils'

interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
  delay?: number
}

export function DataTable<T>({ columns, data, rowKey, delay = 0 }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto scrollbar-thin -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-glass/[0.08]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn('text-left px-3 py-2.5 text-xs font-semibold text-ink-faint uppercase tracking-wider whitespace-nowrap', col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <motion.tr
              key={rowKey(row)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: delay + i * 0.03 }}
              className="border-b border-glass/[0.04] hover:bg-glass/[0.03] transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-3 py-3 text-ink whitespace-nowrap', col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-10 text-ink-faint text-sm">No data to display.</div>
      )}
    </div>
  )
}
