import React from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'rect' | 'circle'
  width?: string
  height?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rect',
  width,
  height,
}) => {
  const baseClasses = 'animate-pulse bg-surface-elevated rounded'
  const variantClasses = {
    text: 'h-4 w-full rounded',
    rect: 'h-12 w-full rounded-lg',
    circle: 'h-10 w-10 rounded-full',
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

interface SkeletonCardProps {
  className?: string
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className }) => {
  return (
    <div className={`p-6 bg-surface-elevated rounded-lg border border-border ${className || ''}`}>
      <Skeleton variant="text" className="w-1/3 mb-3" />
      <Skeleton variant="text" className="w-1/2 mb-2" />
      <Skeleton variant="text" className="w-2/3" />
    </div>
  )
}

interface SkeletonTableProps {
  rows?: number
  className?: string
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  className,
}) => {
  return (
    <div className={`space-y-3 ${className || ''}`}>
      <Skeleton variant="rect" className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="rect" className="h-12 w-full" />
      ))}
    </div>
  )
}
