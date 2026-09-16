import React, { useState, useMemo } from 'react'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  className?: string
  sortable?: boolean
  hideOnMobile?: boolean
  searchAccessor?: (row: T) => string
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  emptyMessage?: string
  className?: string
  searchKey?: string
  searchPlaceholder?: string
  searchAccessor?: (row: T) => string
  searchClassName?: string
  search?: string
  onSearchChange?: (value: string) => void
  onRowClick?: (item: T) => void
  filters?: { key: string; label: string; options: { value: string; label: string }[] }[]
  pageSize?: number
  hideSearch?: boolean
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No hay datos disponibles',
  className = '',
  searchKey,
  searchPlaceholder = 'Buscar...',
  searchAccessor,
  searchClassName = '',
  search: controlledSearch,
  onSearchChange,
  filters = [],
  pageSize = 10,
  hideSearch = false,
  onRowClick,
}: DataTableProps<T>) {
  const [internalSearch, setInternalSearch] = useState('')
  const search = controlledSearch ?? internalSearch
  const setSearch = onSearchChange ?? setInternalSearch
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  const getSearchText = (item: T): string => {
    if (searchAccessor) {
      return String(searchAccessor(item)).toLowerCase()
    }
    if (searchKey) {
      return String((item as any)[searchKey] ?? '').toLowerCase()
    }
    return ''
  }

  const filtered = useMemo(() => {
    let result = [...data]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(item => getSearchText(item).includes(q))
    }

    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(item => String((item as any)[key] ?? '') === value)
      }
    })

    if (sortKey) {
      result.sort((a, b) => {
        const aVal = String(getSearchText(a) ?? '')
        const bVal = String(getSearchText(b) ?? '')
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      })
    }

    return result
  }, [data, search, activeFilters, sortKey, sortDir])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters(f => ({ ...f, [key]: value }))
    setPage(1)
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted" data-testid="datatable-empty">
        <p className="text-lg">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`} data-testid="datatable-table">
      {/* Filters (search is now external) */}
      {!hideSearch && (searchKey || searchAccessor || filters.length > 0) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {searchKey && (
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="input flex-1 text-sm"
              aria-label={searchPlaceholder}
            />
          )}
          {searchAccessor && (
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className={`input flex-1 text-sm ${searchClassName}`}
              aria-label={searchPlaceholder}
            />
          )}
          {filters.map(f => (
            <select
              key={f.key}
              value={activeFilters[f.key] ?? ''}
              onChange={e => handleFilterChange(f.key, e.target.value)}
              className="input text-sm min-w-[140px]"
              aria-label={f.label}
            >
              <option value="">{f.label}</option>
              {f.options.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="w-full">
        <table className="w-full text-sm" role="grid">
          <thead>
            <tr className="border-b border-gray-800">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`text-left py-2 px-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:text-white select-none' : ''} ${col.hideOnMobile ? 'hidden sm:table-cell' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                  aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {sortKey === col.key && (
                      <span className="text-cyan">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map(item => (
              <tr
                key={keyExtractor(item)}
                data-testid={`datatable-row-${keyExtractor(item)}`}
                className={`border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map(col => (
                  <td key={col.key} className={`py-3 px-2 text-gray-300 ${col.hideOnMobile ? 'hidden sm:table-cell' : ''}`}>
                    {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
          <span>{page}/{totalPages}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 hover:text-white disabled:opacity-30 transition-colors"
              aria-label="Página anterior"
            >
              ←
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4))
              const p = start + i
              if (p > totalPages) return null
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg font-medium transition ${
                    p === page
                      ? 'bg-white/10 text-white'
                      : 'text-gray-500 hover:text-white'
                  }`}
                  aria-label={`Página ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 hover:text-white disabled:opacity-30 transition-colors"
              aria-label="Página siguiente"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable