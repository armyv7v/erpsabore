export interface Shipment {
  id: string;
  trackingNumber: string;
  customerName: string;
  status: 'In Transit' | 'Processing' | 'Delivered' | 'Returned';
  statusText: string;
  progress: number;
  carrier: string;
  origin?: string;
  destination?: string;
  issue?: string;
}

export const mockShipments: Shipment[] = [
  {
    id: '1',
    trackingNumber: '#TRK-99021485',
    customerName: 'Global Tech Solutions Inc.',
    status: 'In Transit',
    statusText: 'Est: Oct 24, 2023',
    progress: 65,
    carrier: 'UPS',
    origin: 'Chicago, IL',
    destination: 'San Francisco, CA'
  },
  {
    id: '2',
    trackingNumber: '#TRK-88273612',
    customerName: 'Emma Richardson',
    status: 'Processing',
    statusText: 'Est: Oct 26, 2023',
    progress: 15,
    carrier: 'UPS GROUND'
  },
  {
    id: '3',
    trackingNumber: '#TRK-77123904',
    customerName: 'Design Co. Studio',
    status: 'Delivered',
    statusText: 'Delivered: Oct 22, 2023',
    progress: 100,
    carrier: 'DHL EXPRESS'
  },
  {
    id: '4',
    trackingNumber: '#TRK-11029384',
    customerName: 'Marcus Peterson',
    status: 'Returned',
    statusText: 'Issue: Address Not Found',
    progress: 5,
    carrier: 'FEDEX SMARTPOST',
    issue: 'Shipment Halted'
  }
];