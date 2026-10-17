import { createDemoData } from './demo';
import { EMPLOYEE_INVITATION_STATUS, EMPLOYEE_ROLE, type AgendaState, type BarberRecord, type BarberSchedule, type ClientRecord, type EmployeeRecord, type ProductRecord, type ServiceRecord } from '../types/agenda';

const barberNames = ['Diego', 'Raúl', 'Andrés'];
const clientNames = [
  'Lucía Torres',
  'Mateo Cruz',
  'Inés Ríos',
  'Sofía León',
  'Emilio Vega',
  'Valeria Solís',
  'Nicolás Mora',
  'Renata Díaz',
  'Gael Fuentes',
];

const barbers: BarberRecord[] = barberNames.map((name, index) => ({ id: `barber-${index + 1}`, name }));
const employees: EmployeeRecord[] = barbers.map(({ id, name }) => ({
  id,
  name,
  phone: '',
  role: EMPLOYEE_ROLE.BARBER,
  active: true,
  invitationStatus: EMPLOYEE_INVITATION_STATUS.COMPLETED,
}));
const clients: ClientRecord[] = clientNames.map((name, index) => ({
  id: `client-${index + 1}`,
  name,
  phone: `555-010${index}`,
}));
const services: ServiceRecord[] = [
  { id: 'service-1', name: 'Corte', durationMinutes: 45, price: 300 },
  { id: 'service-2', name: 'Barba', durationMinutes: 30, price: 250 },
  { id: 'service-3', name: 'Corte y barba', durationMinutes: 75, price: 500 },
];
const products: ProductRecord[] = [
  { id: 'product-shampoo', name: 'Shampoo', description: 'Limpieza diaria para cabello.', salePrice: 160, costPrice: 80, stock: 8, category: 'Cabello', active: true },
  { id: 'product-gel', name: 'Gel para cabello', description: 'Fijación flexible.', salePrice: 120, costPrice: 55, stock: 12, category: 'Cabello', active: true },
  { id: 'product-oil', name: 'Aceite para barba', description: 'Cuidado ligero para barba.', salePrice: 190, costPrice: 95, stock: 5, category: 'Barba', active: true },
  { id: 'product-wax', name: 'Cera para peinar', description: 'Acabado natural y fijación flexible.', salePrice: 175, costPrice: 82, stock: 7, category: 'Cabello', active: true },
  { id: 'product-conditioner', name: 'Acondicionador', description: 'Suavidad y cuidado diario.', salePrice: 145, costPrice: 68, stock: 6, category: 'Cabello', active: true },
  { id: 'product-beard-balm', name: 'Bálsamo para barba', description: 'Hidratación y control para barba.', salePrice: 210, costPrice: 102, stock: 4, category: 'Barba', active: true },
  { id: 'product-wood-comb', name: 'Peine de madera', description: 'Peine compacto para cabello y barba.', salePrice: 95, costPrice: 38, stock: 10, category: 'Accesorios', active: true },
];
function dateAtOffset(now: Date, days: number): string {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function createSchedules(): BarberSchedule[] {
  return barbers.map(({ id }) => ({
    barberId: id,
    days: Array.from({ length: 6 }, (_, index) => ({
      weekday: index + 1,
      working: [{ start: '09:00', end: '18:00' }],
      breaks: [{ start: '13:00', end: '14:00' }],
    })),
  }));
}

export function createAgendaSeed(now: Date): AgendaState {
  const appointments = createDemoData(now).appointments.map((appointment) => {
    const service = services.find(({ id }) => id === appointment.serviceIds[0]);
    return {
      ...appointment,
      durationMinutes: service?.durationMinutes ?? appointment.durationMinutes,
      serviceName: service?.name ?? appointment.serviceName,
    };
  });

  return {
    barbers,
    employees,
    clients,
    services,
    products,
    schedules: createSchedules(),
    exceptions: [
      { barberId: 'barber-2', date: dateAtOffset(now, 2), unavailable: true },
      {
        barberId: 'barber-3',
        date: dateAtOffset(now, 3),
        unavailable: false,
        working: [{ start: '12:00', end: '18:00' }],
        breaks: [{ start: '15:00', end: '15:30' }],
      },
    ],
    appointments,
  };
}
