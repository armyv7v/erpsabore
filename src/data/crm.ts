export interface PipelineStage {
  id: string;
  name: string;
  leads: number;
  value: string;
  percentage: number;
  colorClass: string;
}

export interface Contact {
  id: string;
  initials: string;
  name: string;
  rut: string;
  status: 'prospect' | 'client' | 'proposal' | 'inactive';
}

export const mockPipeline: PipelineStage[] = [
  { id: '1', name: 'Prospecto', leads: 12, value: '4.2M', percentage: 85, colorClass: 'bg-primary' },
  { id: '2', name: 'Calificado', leads: 8, value: '3.1M', percentage: 60, colorClass: 'bg-primary' },
  { id: '3', name: 'Propuesta', leads: 5, value: '2.8M', percentage: 45, colorClass: 'bg-primary' },
  { id: '4', name: 'Negociación', leads: 3, value: '1.5M', percentage: 25, colorClass: 'bg-primary' },
  { id: '5', name: 'Cerrado', leads: 10, value: '5.0M', percentage: 100, colorClass: 'bg-green-500' },
];

export const mockContacts: Contact[] = [
  { id: '1', initials: 'AM', name: 'Agrícola Maipo SpA', rut: '76.452.120-K', status: 'prospect' },
  { id: '2', initials: 'CL', name: 'Constructora Los Andes', rut: '77.108.330-4', status: 'client' },
  { id: '3', initials: 'RP', name: 'Retail Patagonia Ltda.', rut: '82.551.400-2', status: 'proposal' },
  { id: '4', initials: 'TG', name: 'Transportes Globales', rut: '96.224.110-3', status: 'inactive' },
];