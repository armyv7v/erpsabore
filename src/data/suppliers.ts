export interface Supplier {
  id: string;
  name: string;
  rut: string;
  category: string;
  statusText: string;
  statusType: 'warning' | 'normal' | 'success';
  pendingBalance: number;
  iconName: string; // will map to Lucide icon in component
}

export const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Distribuidora Industrial S.A.',
    rut: '76.123.456-K',
    category: 'Suministros',
    statusText: 'Vence en 12 días',
    statusType: 'warning',
    pendingBalance: 1250000,
    iconName: 'Store',
  },
  {
    id: '2',
    name: 'Transportes del Sur Ltda.',
    rut: '77.988.221-5',
    category: 'Logística',
    statusText: 'Al día',
    statusType: 'normal',
    pendingBalance: 450800,
    iconName: 'Truck',
  },
  {
    id: '3',
    name: 'Servicios Mantención Pro',
    rut: '15.654.321-0',
    category: 'Servicios',
    statusText: 'Sin deudas',
    statusType: 'success',
    pendingBalance: 0,
    iconName: 'Wrench',
  }
];