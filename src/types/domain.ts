export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type SaleItemKind = 'product' | 'service';
export type SalePaymentMethod = 'cash' | 'card' | 'transfer';
export type SaleStatus = 'completed';

export interface SaleItem {
  kind?: SaleItemKind;
  catalogItemId?: string;
  barberId?: string;
  barberName?: string;
  servicePerformed?: boolean;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface SaleRecord {
  id: string;
  idempotencyKey?: string;
  occurredAt: string;
  items: SaleItem[];
  appointmentId?: string;
  clientId?: string;
  clientName?: string;
  barberName?: string;
  cashReceived?: number;
  changeDue?: number;
  employeeId?: string;
  employeeName?: string;
  paymentMethod?: SalePaymentMethod;
  status?: SaleStatus;
  promotionId?: string;
  promotionName?: string;
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
  paymentStatus?: 'pending' | 'paid';
  durationMinutes: number;
  notes?: string;
}

export interface DemoData {
  sales: SaleRecord[];
  appointments: AppointmentRecord[];
}
