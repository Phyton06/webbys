import React from 'react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: number | string
  trendDirection?: 'up' | 'down'
  className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendDirection,
  className,
}) => {
  return (
    <div className={`p-6 bg-surface-elevated rounded-lg border border-border shadow-sm ${className || ''}`}>
      <p className="text-sm font-medium text-text-muted">{title}</p>
      <div className="mt-2 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold text-text-primary">{value}</h3>
        {trend !== undefined && (
          <span
            data-testid="revenue-trend-badge"
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              trendDirection === 'up'
                ? 'bg-badge-success/20 text-badge-success'
                : 'bg-badge-error/20 text-badge-error'
            }`}
          >
            <span>{trendDirection === 'up' ? '+' : '-'}</span>
            <span>{typeof trend === 'number' ? `${trend}%` : trend}</span>
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
    </div>
  )
}
