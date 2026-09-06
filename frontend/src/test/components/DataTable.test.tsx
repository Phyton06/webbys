import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DataTable } from '../../components/shared/DataTable'

describe('DataTable', () => {
  interface SampleItem {
    id: string
    name: string
    role: string
  }

  const columns = [
    { key: 'name', header: 'Nombre' },
    { key: 'role', header: 'Rol' },
  ]

  const data: SampleItem[] = [
    { id: '1', name: 'Carlos', role: 'Admin' },
    { id: '2', name: 'Ana', role: 'Client' },
  ]

  it('renders empty message when no data is provided', () => {
    render(
      <DataTable<SampleItem>
        columns={columns}
        data={[]}
        keyExtractor={item => item.id}
        emptyMessage="No hay registros disponibles"
      />
    )
    expect(screen.getByTestId('datatable-empty')).toHaveTextContent('No hay registros disponibles')
  })

  it('renders table headers and rows for desktop view', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={item => item.id}
      />
    )
    expect(screen.getByTestId('datatable-table')).toBeInTheDocument()
    expect(screen.getByTestId('datatable-row-1')).toHaveTextContent('Carlos')
    expect(screen.getByTestId('datatable-row-2')).toHaveTextContent('Ana')
  })

  it('renders mobile cards with headers and values', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={item => item.id}
      />
    )
    expect(screen.getByTestId('datatable-cards')).toBeInTheDocument()
    expect(screen.getByTestId('datatable-card-1')).toHaveTextContent('Nombre:')
    expect(screen.getByTestId('datatable-card-1')).toHaveTextContent('Carlos')
  })

  it('supports custom renderCard prop for custom mobile layouts', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={item => item.id}
        renderCard={item => <div className="custom-card">Custom: {item.name}</div>}
      />
    )
    expect(screen.getByText('Custom: Carlos')).toBeInTheDocument()
    expect(screen.getByText('Custom: Ana')).toBeInTheDocument()
  })

  it('supports custom column render function', () => {
    const customColumns = [
      {
        key: 'name',
        header: 'Nombre',
        render: (item: SampleItem) => <strong>{item.name.toUpperCase()}</strong>,
      },
    ]
    render(
      <DataTable
        columns={customColumns}
        data={data}
        keyExtractor={item => item.id}
      />
    )
    expect(screen.getAllByText('CARLOS').length).toBeGreaterThan(0)
  })
})
