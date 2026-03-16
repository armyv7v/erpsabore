export interface PayrollEmployee {
  id: string;
  initials: string;
  name: string;
  role: string;
  netAmount: number;
  status: 'paid' | 'generated' | 'pending';
}

export const mockPayrollSummary = {
  month: 'Septiembre 2024',
  totalHaberes: 12450000,
  growthHaberes: '+5.2%',
  totalDescuentos: 2340500,
  sueldoLiquidoTotal: 10109500,
  descuentosDetails: [
    { name: 'AFP (10% + Comisión)', amount: 1245000, percentage: 53, colorClass: 'bg-primary' },
    { name: 'Salud (7% Fonasa/Isapre)', amount: 871500, percentage: 37, colorClass: 'bg-primary/70' },
    { name: 'Seguro Cesantía (AFC)', amount: 224000, percentage: 10, colorClass: 'bg-primary/40' }
  ]
};

export const mockPayrollEmployees: PayrollEmployee[] = [
  {
    id: '1',
    initials: 'RM',
    name: 'Ricardo Molina',
    role: 'Analista Senior',
    netAmount: 1450000,
    status: 'paid'
  },
  {
    id: '2',
    initials: 'SP',
    name: 'Sofía Pérez',
    role: 'Desarrollador Web',
    netAmount: 2100000,
    status: 'generated'
  },
  {
    id: '3',
    initials: 'CG',
    name: 'Carlos González',
    role: 'Diseñador UI/UX',
    netAmount: 1850000,
    status: 'pending'
  }
];