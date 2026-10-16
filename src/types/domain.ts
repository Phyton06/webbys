export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface SaleItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface SaleRecord {
  id: string;
  occurredAt: string;
  items: SaleItem[];
  grossTotal: number;
  discountTotal: number;
  netTotal: number;
}

export interface AppointmentRecord {
  id: string;
  startsAt: string;
  clientId: string;
  clientName: string;
  barberId: string;
  barberName: string;
  serviceIds: string[];
  serviceName: string;
  status: AppointmentStatus;
  durationMinutes: number;
  notes?: string;
}

export interface DemoData {
  sales: SaleRecord[];
  appointments: AppointmentRecord[];
}
