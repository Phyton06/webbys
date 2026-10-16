import { describe, expect, it } from 'vitest';
import type { BarberRecord, EmployeeRecord } from '../types/agenda';
import {
  canDeactivateEmployee,
  getBookableBarbers,
  normalizeEmployees,
  syncBarberProjection,
} from './employees';

const barbers: BarberRecord[] = [
  { id: 'barber-diego', name: 'Diego' },
  { id: 'barber-raul', name: 'Raúl' },
];

function employee(overrides: Partial<EmployeeRecord> = {}): EmployeeRecord {
  return {
    id: 'barber-diego',
    name: 'Diego',
    phone: '555-0101',
    role: 'barber',
    active: true,
    invitationStatus: 'completed',
    ...overrides,
  };
}

describe('employee compatibility helpers', () => {
  it('normalizes legacy barbers to active Barber employees with their existing IDs', () => {
    expect(normalizeEmployees(undefined, barbers)).toEqual([
      { id: 'barber-diego', name: 'Diego', phone: '', role: 'barber', active: true, invitationStatus: 'completed' },
      { id: 'barber-raul', name: 'Raúl', phone: '', role: 'barber', active: true, invitationStatus: 'completed' },
    ]);
  });

  it('keeps employees authoritative while retaining old barber IDs and names in the projection', () => {
    const employees = [employee({ name: 'Diego Martínez', role: 'assistant' })];

    expect(syncBarberProjection(employees, barbers)).toEqual([
      { id: 'barber-diego', name: 'Diego Martínez' },
      { id: 'barber-raul', name: 'Raúl' },
    ]);
  });

  it('adds new Barber employees to the compatibility projection', () => {
    expect(syncBarberProjection([employee(), employee({ id: 'employee-new', name: 'Ana' })], [])).toEqual([
      { id: 'barber-diego', name: 'Diego' },
      { id: 'employee-new', name: 'Ana' },
    ]);
  });

  it('offers only active Barbers for new bookings and retains an assigned barber while editing', () => {
    const employees = [
      employee(),
      employee({ id: 'barber-raul', name: 'Raúl', active: false }),
      employee({ id: 'employee-assistant', name: 'Ana', role: 'assistant' }),
    ];

    expect(getBookableBarbers(employees, barbers)).toEqual([barbers[0]]);
    expect(getBookableBarbers(employees, barbers, 'barber-raul')).toEqual(barbers);
  });

  it('prevents deactivation of the last active Administrator', () => {
    const admins = [employee({ id: 'admin-one', role: 'administrator' })];

    expect(canDeactivateEmployee('admin-one', admins)).toBe(false);
    expect(canDeactivateEmployee('admin-one', [...admins, employee({ id: 'admin-two', role: 'administrator' })])).toBe(true);
    expect(canDeactivateEmployee('missing', admins)).toBe(false);
  });
});
