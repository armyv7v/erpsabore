import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LocalDteAdapter } from './local-dte-adapter';

describe('LocalDteAdapter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debería procesar la factura exitosamente y con links correctos', async () => {
    const adapter = new LocalDteAdapter();
    const invoice = {
      id: 'inv-123',
      number: 'FACT-001',
      issue_date: '2026-05-20',
      due_date: '2026-06-20',
      subtotal: 10000,
      tax: 1900,
      total: 11900,
      dte_type: 33,
    };
    const items = [
      {
        description: 'Servicio de prueba',
        qty: 1,
        unit_price: 10000,
        line_total: 10000,
      },
    ];
    const customer = {
      name: 'Cliente de Prueba',
      rut: '12.345.678-9',
      email: 'cliente@prueba.cl',
    };

    const promise = adapter.processInvoice(invoice, items, customer);

    // Avanzar los timers virtuales 1500ms para disparar el timeout del adapter instantáneamente
    await vi.advanceTimersByTimeAsync(1500);

    const result = await promise;

    expect(result.success).toBe(true);
    expect(result.folio).toBe('FACT-001');
    expect(result.xmlUrl).toBe('/api/dte/mock/xml/inv-123');
    expect(result.pdfUrl).toBe('/dte/pdf/inv-123');
    expect(result.trackId).toMatch(/^TRK-\d{6}$/);
    expect(result.siiMessage).toContain('DTE Aceptado con Éxito por el SII');
  });

  it('debería usar valores por defecto si no se especifican el folio o dte_type', async () => {
    const adapter = new LocalDteAdapter();
    const invoice = {
      id: 'inv-123',
      number: '', // Folio vacío
      issue_date: '2026-05-20',
      due_date: '2026-06-20',
      subtotal: 10000,
      tax: 1900,
      total: 11900,
    };
    const items: { product_id: string | null; description: string; qty: number; unit_price: number; line_total: number }[] = [];
    const customer = {
      name: 'Cliente de Prueba',
      rut: '12.345.678-9',
    };

    const promise = adapter.processInvoice(invoice, items, customer);
    await vi.advanceTimersByTimeAsync(1500);
    const result = await promise;

    expect(result.success).toBe(true);
    expect(result.folio).toBe('000000');
  });
});
