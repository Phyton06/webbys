import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatCard } from '../../../components/shared/StatCard'

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Total Revenue" value="$12,500" />)
    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('$12,500')).toBeInTheDocument()
  })

  it('renders trend indicator when trend is provided', () => {
    render(<StatCard title="Total Revenue" value="$12,500" trend={15} trendDirection="up" />)
    expect(screen.getByText('15%')).toBeInTheDocument()
  })
})
