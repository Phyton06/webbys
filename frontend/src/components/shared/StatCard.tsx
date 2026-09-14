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
    <div className={`p-6 bg-[#1A1A1A] rounded-2xl border border-[#333333] shadow-[0_4px_30px_rgba(0,0,0,0.4)] ${className || ''}`}>
      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{title}</p>
      <div className="mt-2 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold text-text-primary tracking-tight">{value}</h3>
        {trend !== undefined && (
          <span
            data-testid="revenue-trend-badge"
            className={`inline-flex items-center px-2.5 py-0.5 rounded border text-[11px] font-bold tracking-wide ${
              trendDirection === 'up'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}
          >
            <span>{trendDirection === 'up' ? '+' : '-'}</span>
            <span>{typeof trend === 'number' ? `${trend}%` : trend}</span>
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-text-muted mt-1.5 italic">{subtitle}</p>}
    </div>
  )
}
