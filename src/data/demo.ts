import type { AppointmentRecord, DemoData, SaleItem, SaleRecord } from '../types/domain';

const servicePrices = [300, 350, 400, 280, 450, 320, 380, 500, 340, 420];
const productPrices = [120, 160, 140, 180];
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
const barberNames = ['Diego', 'Raúl', 'Andrés'];
const serviceNames = ['Corte', 'Barba', 'Corte y barba'];
const appointmentSlots = [
  { hour: 9, minute: 30 },
  { hour: 10, minute: 30 },
  { hour: 12, minute: 0 },
  { hour: 14, minute: 0 },
  { hour: 16, minute: 30 },
];

function atRelativeDate(now: Date, daysFromToday: number, hour: number, minute: number): string {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function makeSale(index: number, now: Date): SaleRecord {
  const servicePrice = servicePrices[index % servicePrices.length] ?? 300;
  const items: SaleItem[] = [{
    name: serviceNames[index % serviceNames.length] ?? 'Corte',
    quantity: 1,
    unitPrice: servicePrice,
  }];

  if (index % 3 === 0) {
    const productPrice = productPrices[index % productPrices.length] ?? 120;
    items.push({
      name: index % 2 === 0 ? 'Cera para cabello' : 'Aceite para barba',
      quantity: 1,
      unitPrice: productPrice,
    });
  }

  const grossTotal = items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  const discountTotal = index % 7 === 0 ? 50 : 0;
  const daysFromToday = index - 34;
  const hour = 9 + (index % 10);

  return {
    id: `demo-sale-${String(index + 1).padStart(2, '0')}`,
    occurredAt: atRelativeDate(now, daysFromToday, hour, index % 2 === 0 ? 0 : 30),
    items,
    grossTotal,
    discountTotal,
    netTotal: grossTotal - discountTotal,
  };
}

function makeAppointment(
  index: number,
  daysFromToday: number,
  now: Date,
): AppointmentRecord {
  const slot = appointmentSlots[index % appointmentSlots.length] ?? appointmentSlots[0]!;
  const statuses: AppointmentRecord['status'][] = ['completed', 'confirmed', 'pending', 'cancelled', 'pending'];
  const clientIndex = index % clientNames.length;
  const barberIndex = index % barberNames.length;
  const serviceIndex = index % serviceNames.length;

  return {
    id: `demo-appointment-${index + 1}`,
    startsAt: atRelativeDate(now, daysFromToday, slot.hour, slot.minute),
    clientId: `client-${clientIndex + 1}`,
    clientName: clientNames[clientIndex] ?? 'Cliente',
    barberId: `barber-${barberIndex + 1}`,
    barberName: barberNames[barberIndex] ?? 'Diego',
    serviceIds: [`service-${serviceIndex + 1}`],
    serviceName: serviceNames[serviceIndex] ?? 'Corte',
    status: statuses[index % statuses.length] ?? 'pending',
    durationMinutes: index % 2 === 0 ? 45 : 30,
  };
}

export function createDemoData(now: Date): DemoData {
  const sales = Array.from({ length: 35 }, (_, index) => makeSale(index, now));
  const appointments = [
    ...appointmentSlots.map((_, index) => makeAppointment(index, 0, now)),
    ...appointmentSlots.slice(0, 4).map((_, index) => makeAppointment(index + 5, 1, now)),
  ];

  return { sales, appointments };
}
