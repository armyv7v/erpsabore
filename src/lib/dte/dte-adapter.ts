export interface DteResult {
  success: boolean;
  folio: string;
  xmlUrl?: string;
  pdfUrl?: string;
  trackId?: string;
  siiMessage?: string;
  error?: string;
}

export interface DteAdapter {
  /**
   * Genera el DTE y realiza el flujo simulado/real de timbrado digital.
   */
  processInvoice(
    invoice: {
      id: string;
      number: string;
      issue_date: string;
      due_date: string;
      subtotal: number;
      tax: number;
      total: number;
      dte_type?: number;
    },
    items: Array<{
      product_id?: string | null;
      description: string;
      qty: number;
      unit_price: number;
      line_total: number;
    }>,
    customer: {
      name: string;
      rut: string;
      email?: string | null;
    }
  ): Promise<DteResult>;
}
