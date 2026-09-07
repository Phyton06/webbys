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
    <div className={`w-full flex flex-col gap-4 ${className}`} data-testid="datatable-table">
      {data.map(item => (
        <div
          key={keyExtractor(item)}
          data-testid={`datatable-row-${keyExtractor(item)}`}
          className="p-5 bg-[#1A1A1A] border border-[#333333] rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:bg-[#222222] transition-all duration-200"
        >
          {/* Column 1: Primary Identity Block */}
          <div className="flex-1 min-w-0">
            {columns[0] && (
              <div>
                {columns[0].render ? columns[0].render(item) : (
                  <p className="font-semibold text-text-primary leading-tight text-sm">
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
      ))}
    </div>
  )
}

export default DataTable
