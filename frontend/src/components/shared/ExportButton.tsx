import React, { useState } from 'react'

interface ExportButtonProps {
  onExport: () => Promise<string> | string
  filename?: string
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  filename = 'export.csv',
}) => {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const csvContent = await onExport()
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting CSV:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="inline-flex items-center px-4 py-2 text-sm font-medium text-text-primary bg-surface-elevated border border-border rounded-md shadow-sm hover:bg-surface focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
    >
      {isExporting ? 'Exportando...' : 'Exportar CSV'}
    </button>
  )
}
