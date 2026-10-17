export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type SaleItemKind = 'product' | 'service';
export type SalePaymentMethod = 'cash' | 'card' | 'transfer';
export type SaleStatus = 'completed';

export interface SaleItem {
  kind?: SaleItemKind;
  catalogItemId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface SaleRecord {
  id: string;
  occurredAt: string;
  items: SaleItem[];
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
  durationMinutes: number;
  notes?: string;
}

export interface DemoData {
  sales: SaleRecord[];
  appointments: AppointmentRecord[];
}
