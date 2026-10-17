import type { AppointmentRecord, DemoData, SaleItem, SaleRecord } from '../types/domain';

const servicePrices = [300, 250, 500];
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
const saleProductSnapshots = [
  { id: 'product-wax', name: 'Cera para peinar', price: 175 },
  { id: 'product-oil', name: 'Aceite para barba', price: 190 },
];
const salePaymentMethods = ['cash', 'card', 'transfer'] as const;
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

function makeSale(index: number, daysFromToday: number, now: Date): SaleRecord {
  const serviceIndex = index % serviceNames.length;
  const items: SaleItem[] = [{
    kind: 'service',
    catalogItemId: `service-${serviceIndex + 1}`,
    name: serviceNames[serviceIndex] ?? 'Corte',
    quantity: 1,
    unitPrice: servicePrices[serviceIndex] ?? 300,
  }];

  if (index % 3 === 0) {
    const product = saleProductSnapshots[index % 2] ?? saleProductSnapshots[0]!;
    items.push({
      kind: 'product',
      catalogItemId: product.id,
      name: product.name,
      quantity: 1,
      unitPrice: product.price,
    });
  }

  const grossTotal = items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  const attributedToPromotion = index % 7 === 0;
  const discountTotal = attributedToPromotion ? 50 : 0;
  const hour = 8 + (index % 4);

  return {
    id: `demo-sale-${String(index + 1).padStart(2, '0')}`,
    occurredAt: atRelativeDate(now, daysFromToday, hour, index % 2 === 0 ? 0 : 30),
    items,
    employeeId: `barber-${(index % barberNames.length) + 1}`,
    employeeName: barberNames[index % barberNames.length] ?? 'Diego',
    paymentMethod: salePaymentMethods[index % salePaymentMethods.length] ?? 'cash',
    status: 'completed',
    ...(attributedToPromotion ? { promotionId: 'demo-promotion-seasonal', promotionName: 'Oferta de temporada' } : {}),
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

const DEMO_SALES_DAYS = 90;

function makeSales(now: Date): SaleRecord[] {
  const sales: SaleRecord[] = [];
  let index = 0;

  for (let daysFromToday = -(DEMO_SALES_DAYS - 1); daysFromToday <= 0; daysFromToday += 1) {
    const salesPerDay = 1 + ((daysFromToday + (DEMO_SALES_DAYS - 1)) % 3);
    for (let saleOfDay = 0; saleOfDay < salesPerDay; saleOfDay += 1) {
      sales.push(makeSale(index, daysFromToday, now));
      index += 1;
    }
  }

  return sales;
}

export function createDemoData(now: Date): DemoData {
  const sales = makeSales(now);
  const appointments = [
    ...appointmentSlots.map((_, index) => makeAppointment(index, 0, now)),
    ...appointmentSlots.slice(0, 4).map((_, index) => makeAppointment(index + 5, 1, now)),
  ];

  return { sales, appointments };
}
