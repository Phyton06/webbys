import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FilterBar } from '../../../components/shared/FilterBar'

describe('FilterBar', () => {
  it('renders filters and triggers onChange', () => {
    const onChange = vi.fn()
    const options = [
      { key: 'status', label: 'Estado', choices: [{ value: 'ALL', label: 'Todos' }, { value: 'COMPLETED', label: 'Completados' }] }
    ]
    render(<FilterBar options={options} values={{ status: 'ALL' }} onChange={onChange} />)

    expect(screen.getByLabelText('Estado')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'COMPLETED' } })
    expect(onChange).toHaveBeenCalledWith({ status: 'COMPLETED' })
  })
})
