export interface CashFlowTransaction {
  id: string;
  date: string;
  concept: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'conciliado' | 'pendiente';
}

export const mockCashFlow: CashFlowTransaction[] = [
  {
    id: '1',
    date: '05 Jun',
    concept: 'Venta Webpay - Pedido #4432',
    category: 'Ingreso Operacional',
    amount: 1250000,
    type: 'income',
    status: 'conciliado'
  },
  {
    id: '2',
    date: '04 Jun',
    concept: 'Pago Sueldos Mayo',
    category: 'Gastos de Personal',
    amount: 4200000,
    type: 'expense',
    status: 'conciliado'
  },
  {
    id: '3',
    date: '03 Jun',
    concept: 'Proveedor Insumos S.A.',
    category: 'Pago Proveedores',
    amount: 850000,
    type: 'expense',
    status: 'pendiente'
  },
  {
    id: '4',
    date: '01 Jun',
    concept: 'Cobro Factura #990',
    category: 'Servicios Logísticos',
    amount: 2100000,
    type: 'income',
    status: 'conciliado'
  }
];

export const expenseDistribution = [
  { category: 'Sueldos y Previsión', percentage: 62, colorClass: 'bg-primary' },
  { category: 'Proveedores', percentage: 25, colorClass: 'bg-primary/70' },
  { category: 'Servicios Básicos y Arriendos', percentage: 10, colorClass: 'bg-primary/40' },
  { category: 'Otros Gastos', percentage: 3, colorClass: 'bg-primary/20' },
];