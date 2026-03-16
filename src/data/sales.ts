export interface Invoice {
  id: string;
  folio: string;
  rut: string;
  clientName: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
}

export const mockInvoices: Invoice[] = [
  {
    id: '1',
    folio: '#F-2304',
    rut: '76.123.456-K',
    clientName: 'Constructora Los Andes SpA',
    date: '12 Oct 2023',
    amount: 1240500,
    status: 'paid',
  },
  {
    id: '2',
    folio: '#F-2305',
    rut: '77.987.654-3',
    clientName: 'Servicios Mineros Atacama',
    date: '28 Oct 2023',
    amount: 890000,
    status: 'pending',
  },
  {
    id: '3',
    folio: '#F-2306',
    rut: '15.543.210-9',
    clientName: 'Distribuidora Central Ltda',
    date: '05 Sep 2023',
    amount: 450000,
    status: 'overdue',
  },
  {
    id: '4',
    folio: '#F-2307',
    rut: '98.444.222-1',
    clientName: 'Inmobiliaria Providencia',
    date: '15 Oct 2023',
    amount: 3200000,
    status: 'paid',
  }
];
