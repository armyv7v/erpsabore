export interface BankStatementRow {
  id: string;
  date: string;
  concept: string;
  reference: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'matched' | 'discrepancy' | 'pending';
}

export interface ERPMatchRow {
  id: string;
  bankId: string;
  date: string;
  concept: string;
  reference: string;
  amount: number;
  type: 'income' | 'expense';
  matchConfidence?: number;
  isMissing?: boolean;
}

export const mockBankStatements: BankStatementRow[] = [
  {
    id: 'b1',
    date: '12 Oct 2023',
    concept: 'Pago Proveedor: Tech Solutions',
    reference: 'Ref: BNK-992834',
    amount: 1200.00,
    type: 'expense',
    status: 'matched'
  },
  {
    id: 'b2',
    date: '14 Oct 2023',
    concept: 'Comisión Mantenimiento',
    reference: 'Ref: FEES-OCT',
    amount: 15.50,
    type: 'expense',
    status: 'discrepancy'
  },
  {
    id: 'b3',
    date: '15 Oct 2023',
    concept: 'Depósito Cliente: Innova Corp',
    reference: 'Ref: DEP-8821',
    amount: 3450.00,
    type: 'income',
    status: 'pending'
  }
];

export const mockERPRecords: ERPMatchRow[] = [
  {
    id: 'e1',
    bankId: 'b1',
    date: '12 Oct 2023',
    concept: 'Factura Compra #F-2023-44',
    reference: 'Tech Solutions • Libro Mayor',
    amount: 1200.00,
    type: 'expense'
  },
  {
    id: 'e2',
    bankId: 'b2',
    date: '',
    concept: '',
    reference: '',
    amount: 0,
    type: 'expense',
    isMissing: true
  },
  {
    id: 'e3',
    bankId: 'b3',
    date: '14 Oct 2023 (Diferencia 1 día)',
    concept: 'Cobro Factura #V-890',
    reference: 'Innova Corp • Ventas',
    amount: 3450.00,
    type: 'income',
    matchConfidence: 98
  }
];