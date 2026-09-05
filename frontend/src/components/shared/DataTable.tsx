import React, { useState } from 'react'

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string | number
  searchPlaceholder?: string
  searchKey?: keyof T
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = 'Buscar...',
  searchKey,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  // Filter
  const filteredData = React.useMemo(() => {
    if (!searchTerm || !searchKey) return data
    return data.filter((item) => {
      const value = item[searchKey]
      if (value === undefined || value === null) return false
      return String(value).toLowerCase().includes(searchTerm.toLowerCase())
    })
  }, [data, searchTerm, searchKey])

  // Sort
  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData
    const sorted = [...filteredData]
    sorted.sort((a, b) => {
      // Safely access properties, fallback to string conversion if needed
      const valA = (a as any)[sortKey]
      const valB = (b as any)[sortKey]

      if (valA === undefined || valA === null) return 1
      if (valB === undefined || valB === null) return -1

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredData, sortKey, sortDirection])

  return (
    <div className="flex flex-col gap-4">
      {searchKey && (
        <div className="flex justify-between items-center">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary w-full max-w-xs bg-surface text-text-primary"
          />
        </div>
      )}

      <div className="overflow-x-auto border border-border rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-border text-left text-sm text-text-muted">
          <thead className="bg-surface text-xs text-text-muted uppercase font-semibold">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  onClick={() =>
                    column.sortable !== false && handleSort(String(column.key))
                  }
                  className={`px-6 py-3 ${
                    column.sortable !== false
                      ? 'cursor-pointer hover:bg-surface-elevated select-none'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {sortKey === column.key && (
                      <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-surface-elevated divide-y divide-border">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-text-muted"
                >
                  No se encontraron resultados
                </td>
              </tr>
            ) : (
              sortedData.map((item) => (
                <tr key={String(keyExtractor(item))} className="hover:bg-surface">
                  {columns.map((column) => (
                    <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap">
                      {column.render
                        ? column.render(item)
                        : String((item as any)[column.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
