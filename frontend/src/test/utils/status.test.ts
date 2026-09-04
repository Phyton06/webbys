import { describe, it, expect } from 'vitest'
import { mapStatus, getStatusDisplay } from '../../utils/status'

describe('mapStatus', () => {
  it('maps PENDING to PENDIENTE', () => expect(mapStatus('PENDING')).toBe('PENDIENTE'))
  it('maps CONFIRMED to CONFIRMADA', () => expect(mapStatus('CONFIRMED')).toBe('CONFIRMADA'))
  it('maps IN_PROGRESS to EN_CURSO', () => expect(mapStatus('IN_PROGRESS')).toBe('EN_CURSO'))
  it('maps COMPLETED to COMPLETADA', () => expect(mapStatus('COMPLETED')).toBe('COMPLETADA'))
  it('maps CANCELLED to CANCELADA', () => expect(mapStatus('CANCELLED')).toBe('CANCELADA'))
  it('returns PENDIENTE for unknown status', () => expect(mapStatus('UNKNOWN')).toBe('PENDIENTE'))
  it('returns PENDIENTE for empty string', () => expect(mapStatus('')).toBe('PENDIENTE'))
})

describe('getStatusDisplay', () => {
  it('returns yellow for PENDING', () => {
    expect(getStatusDisplay('PENDING')).toEqual({ label: 'Pendiente', color: 'yellow' })
  })
  it('returns blue for CONFIRMED', () => {
    expect(getStatusDisplay('CONFIRMED')).toEqual({ label: 'Confirmada', color: 'blue' })
  })
  it('returns green for COMPLETED', () => {
    expect(getStatusDisplay('COMPLETED')).toEqual({ label: 'Completada', color: 'green' })
  })
  it('returns red for CANCELLED', () => {
    expect(getStatusDisplay('CANCELLED')).toEqual({ label: 'Cancelada', color: 'red' })
  })
  it('returns gray for unknown status', () => {
    expect(getStatusDisplay('UNKNOWN')).toEqual({ label: 'UNKNOWN', color: 'gray' })
  })
  it('returns gray for default case', () => {
    expect(getStatusDisplay('WHATEVER')).toEqual({ label: 'WHATEVER', color: 'gray' })
  })
})
