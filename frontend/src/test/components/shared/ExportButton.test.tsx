import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExportButton } from '../../../components/shared/ExportButton'

describe('ExportButton', () => {
  it('renders button and calls onExport on click', async () => {
    const onExport = vi.fn().mockResolvedValue('csv,content')
    render(<ExportButton onExport={onExport} filename="test.csv" />)

    const btn = screen.getByText('Exportar CSV')
    expect(btn).toBeInTheDocument()

    fireEvent.click(btn)
    await waitFor(() => {
      expect(onExport).toHaveBeenCalled()
    })
  })
})
