import type { CashMovementStatus, InvoiceStatus } from "@/lib/types/erp";

const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  draft: "Borrador",
  issued: "Emitida",
  partially_paid: "Pago parcial",
  paid: "Pagada",
  cancelled: "Anulada",
  overdue: "Vencida",
};

const cashMovementStatusLabels: Record<CashMovementStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  reversed: "Revertido",
};

export function formatInvoiceStatus(status: InvoiceStatus) {
  return invoiceStatusLabels[status] ?? status;
}

export function formatCashMovementStatus(status: CashMovementStatus) {
  return cashMovementStatusLabels[status] ?? status;
}
