export interface DocumentDTE {
  id: string;
  type: string;
  typeCode: string;
  folio: string;
  client: string;
  amount: number;
  status: 'accepted' | 'pending' | 'rejected';
  isTransfer?: boolean;
}

export const mockDTEs: DocumentDTE[] = [
  {
    id: '1',
    type: 'Factura Electrónica',
    typeCode: 'F33',
    folio: '4501',
    client: 'Sociedad Comercial Los Andes SpA',
    amount: 1240500,
    status: 'accepted',
  },
  {
    id: '2',
    type: 'Boleta Electrónica',
    typeCode: 'F39',
    folio: '12903',
    client: 'Venta Público General',
    amount: 15990,
    status: 'pending',
  },
  {
    id: '3',
    type: 'Guía de Despacho',
    typeCode: 'F52',
    folio: '802',
    client: 'Constructora Horizonte Ltda',
    amount: 0,
    status: 'accepted',
    isTransfer: true,
  },
  {
    id: '4',
    type: 'Factura Electrónica',
    typeCode: 'F33',
    folio: '4500',
    client: 'Agroindustrial Maipo',
    amount: 890200,
    status: 'rejected',
  }
];