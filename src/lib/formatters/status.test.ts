import { describe, it, expect } from 'vitest';
import { formatInvoiceStatus, formatCashMovementStatus } from './status';
import type { InvoiceStatus, CashMovementStatus } from '@/lib/types/erp';

describe('Formatters de Estado', () => {
  describe('formatInvoiceStatus', () => {
    it('debería retornar la etiqueta correcta en español para estados conocidos de facturas', () => {
      expect(formatInvoiceStatus('draft')).toBe('Borrador');
      expect(formatInvoiceStatus('issued')).toBe('Emitida');
      expect(formatInvoiceStatus('partially_paid')).toBe('Pago parcial');
      expect(formatInvoiceStatus('paid')).toBe('Pagada');
      expect(formatInvoiceStatus('cancelled')).toBe('Anulada');
      expect(formatInvoiceStatus('overdue')).toBe('Vencida');
    });

    it('debería retornar el mismo string si el estado no es conocido (fallback)', () => {
      // Usamos "as InvoiceStatus" para sortear el chequeo estricto de tipos de TS
      expect(formatInvoiceStatus('unknown_status' as InvoiceStatus)).toBe('unknown_status');
    });
  });

  describe('formatCashMovementStatus', () => {
    it('debería retornar la etiqueta correcta en español para estados conocidos de movimientos de caja', () => {
      expect(formatCashMovementStatus('pending')).toBe('Pendiente');
      expect(formatCashMovementStatus('confirmed')).toBe('Confirmado');
      expect(formatCashMovementStatus('reversed')).toBe('Revertido');
    });

    it('debería retornar el mismo string si el estado no es conocido (fallback)', () => {
      expect(formatCashMovementStatus('unknown_movement' as CashMovementStatus)).toBe('unknown_movement');
    });
  });
});
