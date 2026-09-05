import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog'

describe('ConfirmDialog', () => {
  it('does not render when isOpen is false', () => {
    render(<ConfirmDialog isOpen={false} title="Confirm Delete" message="Are you sure?" onConfirm={() => {}} onCancel={() => {}} />)
    expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument()
  })

  it('renders and handles callbacks when isOpen is true', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<ConfirmDialog isOpen={true} title="Confirm Delete" message="Are you sure?" onConfirm={onConfirm} onCancel={onCancel} />)

    expect(screen.getByText('Confirm Delete')).toBeInTheDocument()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Confirmar'))
    expect(onConfirm).toHaveBeenCalled()

    fireEvent.click(screen.getByText('Cancelar'))
    expect(onCancel).toHaveBeenCalled()
  })
})
