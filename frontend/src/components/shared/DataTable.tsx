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
  renderCard?: (item: T) => React.ReactNode
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No hay datos disponibles',
  renderCard,
  className = '',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="card text-center py-8 text-white/50" data-testid="datatable-empty">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      {/* Mobile view (< 640px / sm:hidden): Stacked cards */}
      <div className="sm:hidden space-y-3" data-testid="datatable-cards">
        {data.map(item => {
          const key = keyExtractor(item)
          if (renderCard) {
            return (
              <div key={key} data-testid={`datatable-card-${key}`}>
                {renderCard(item)}
              </div>
            )
          }

          return (
            <div
              key={key}
              data-testid={`datatable-card-${key}`}
              className="card p-4 space-y-2 border border-white/10"
            >
              {columns.map(col => (
                <div key={col.key} className="flex justify-between items-center text-sm gap-2">
                  <span className="text-white/50 font-medium">{col.header}:</span>
                  <span className="text-white text-right">
                    {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                  </span>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Desktop view (>= 640px / hidden sm:block): Structured table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse" data-testid="datatable-table">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/50">
              {columns.map(col => (
                <th key={col.key} className={`py-3 px-4 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {data.map(item => (
              <tr
                key={keyExtractor(item)}
                data-testid={`datatable-row-${keyExtractor(item)}`}
                className="hover:bg-white/5 transition-colors"
              >
                {columns.map(col => (
                  <td key={col.key} className={`py-3 px-4 ${col.className || ''}`}>
                    {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataTable

// Responsive card stacking for mobile (from redesign)
// Added: sm:hidden for card view, hidden sm:block for table view
