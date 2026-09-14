import React from 'react'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  className?: string
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  emptyMessage?: string
  className?: string
  searchKey?: string
  searchPlaceholder?: string
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No hay datos disponibles',
  className = '',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted" data-testid="datatable-empty">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={`w-full flex flex-col gap-3 ${className}`} data-testid="datatable-table">
      {data.map(item => (
        <div
          key={keyExtractor(item)}
          data-testid={`datatable-row-${keyExtractor(item)}`}
          className="flex min-h-[64px] bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:bg-[#222222] transition-all duration-200"
        >
          {/* Barber-Pole status-colored stripe accent */}
          <div
            className="w-3 shrink-0"
            style={{
              background: (() => {
                const status = String((item as any).status || '').toUpperCase()
                const colorMap: Record<string, string> = {
                  COMPLETADA: '#22c55e',
                  CONFIRMADA: '#00BCD4',
                  PENDIENTE: '#f59e0b',
                  EN_CURSO: '#a855f7',
                  CANCELADA: '#ef4444',
                  // Payments
                  COMPLETED: '#22c55e',
                  PENDING: '#f59e0b',
                  FAILED: '#ef4444',
                  REFUNDED: '#a855f7',
                  // Campaigns
                  ACTIVE: '#22c55e',
                  PAUSED: '#f59e0b',
                  DRAFT: '#666666',
                }
                const color = colorMap[status] || '#00BCD4'
                return `repeating-linear-gradient(-45deg, transparent, transparent 4px, ${color} 4px, ${color} 8px)`
              })(),
              opacity: 0.8,
            }}
          />

          {/* Core Content Enclosure */}
          <div className="flex-1 px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
            {/* Column 1: Primary Identity Block */}
            <div className="flex-1 min-w-0">
              {columns[0] && (
                <div>
                  {columns[0].render ? columns[0].render(item) : (
                    <p className="font-semibold text-text-primary leading-tight text-sm truncate">
                      {String((item as any)[columns[0].key] ?? '')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Sibling Columns: Metadata & Interactive elements */}
            <div className="flex flex-wrap gap-4 items-center justify-between sm:justify-end text-sm">
              {columns.slice(1).map(col => (
                <div key={col.key} className="flex flex-col sm:items-end gap-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block sm:hidden">
                    {col.header}
                  </span>
                  <div className="text-text-primary font-medium">
                    {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default DataTable
