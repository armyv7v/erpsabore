import { mockContacts } from "@/data/crm";
import { mockCashFlow } from "@/data/finance";
import { mockProducts } from "@/data/inventory";
import { mockBankStatements, mockERPRecords } from "@/data/reconciliation";
import { mockInvoices } from "@/data/sales";
import { mockSuppliers } from "@/data/suppliers";
import type {
  AccountsReceivableRecord,
  CashMovementRecord,
  CustomerRecord,
  FinanceMetrics,
  InvoiceRecord,
} from "@/lib/types/erp";

const FALLBACK_TENANT_ID = "00000000-0000-0000-0000-000000000001";

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function ratio(part: number, total: number) {
  if (!total) {
    return 0;
  }

  return round((part / total) * 100, 1);
}

export function getFallbackCustomers(): CustomerRecord[] {
  return mockContacts.map((contact) => ({
    id: contact.id.padStart(8, "0").slice(0, 8) + "-0000-4000-8000-000000000000",
    tenantId: FALLBACK_TENANT_ID,
    name: contact.name,
    rut: contact.rut,
    email: null,
    phone: null,
    notes: contact.status,
  }));
}

export function getFallbackInvoices(): InvoiceRecord[] {
  const customers = getFallbackCustomers();

  const base: InvoiceRecord[] = mockInvoices.map((invoice) => {
    const customer = customers.find((entry) => entry.rut === invoice.rut);
    const outstandingBalance = invoice.status === "paid" ? 0 : invoice.amount;

    return {
      id: `${invoice.id.padStart(8, "0")}-0000-4000-8000-000000000000`,
      tenantId: FALLBACK_TENANT_ID,
      customerId: customer?.id ?? `customer-${invoice.id}`,
      customerName: invoice.clientName,
      customerRut: invoice.rut,
      number: invoice.folio.replace("#", ""),
      issueDate: invoice.date,
      dueDate: invoice.date,
      currency: "CLP",
      notes: null,
      subtotal: invoice.amount,
      tax: 0,
      total: invoice.amount,
      status:
        invoice.status === "paid"
          ? "paid"
          : invoice.status === "pending"
            ? "issued"
            : "overdue",
      createdBy: null,
      items: [
        {
          id: `line-${invoice.id}`,
          invoiceId: `${invoice.id.padStart(8, "0")}-0000-4000-8000-000000000000`,
          tenantId: FALLBACK_TENANT_ID,
          description: `Servicio facturado ${invoice.folio}`,
          qty: 1,
          unitPrice: invoice.amount,
          lineTotal: invoice.amount,
        },
      ],
      outstandingBalance,
    };
  });

  // Agregar factura borrador de prueba para Playwright E2E
  base.push({
    id: "99999999-0000-4000-8000-000000000000",
    tenantId: FALLBACK_TENANT_ID,
    customerId: "customer-mock-draft",
    customerName: "Cliente Borrador E2E",
    customerRut: "78.111.222-3",
    number: "F-9999",
    issueDate: "2026-05-20",
    dueDate: "2026-06-20",
    currency: "CLP",
    notes: "Factura de prueba en borrador",
    subtotal: 500000,
    tax: 95000,
    total: 595000,
    status: "draft",
    createdBy: null,
    items: [
      {
        id: "line-draft-mock",
        invoiceId: "99999999-0000-4000-8000-000000000000",
        tenantId: FALLBACK_TENANT_ID,
        description: "Servicio de Consultoría TI E2E",
        qty: 1,
        unitPrice: 500000,
        lineTotal: 500000,
      }
    ],
    outstandingBalance: 595000,
  });

  return base;
}

export function getFallbackReceivables(): AccountsReceivableRecord[] {
  return getFallbackInvoices()
    .filter((invoice) => invoice.outstandingBalance > 0)
    .map((invoice) => ({
      id: `ar-${invoice.id}`,
      tenantId: invoice.tenantId,
      invoiceId: invoice.id,
      balance: invoice.outstandingBalance,
      status: invoice.status === "overdue" ? "overdue" : "open",
      dueDate: invoice.dueDate,
      lastPaymentAt: null,
    }));
}

export function getFallbackCashMovements(): CashMovementRecord[] {
  return mockCashFlow.map((movement) => ({
    id: `cash-${movement.id}`,
    tenantId: FALLBACK_TENANT_ID,
    sourceType: movement.type === "income" ? "invoice" : "supplier",
    sourceId: null,
    kind: movement.type,
    amount: movement.amount,
    movementDate: movement.date,
    reference: movement.concept,
    paymentMethod: movement.type === "income" ? "webpay" : "transferencia",
    status: movement.status === "conciliado" ? "confirmed" : "pending",
  }));
}

export function getFallbackFinanceMetrics(): FinanceMetrics {
  const invoices = getFallbackInvoices();
  const receivables = getFallbackReceivables();
  const cashMovements = getFallbackCashMovements();
  const income = cashMovements.filter((movement) => movement.kind === "income");
  const expenses = cashMovements.filter((movement) => movement.kind === "expense");
  const totalIncome = income.reduce((sum, movement) => sum + movement.amount, 0);
  const totalExpenses = expenses.reduce((sum, movement) => sum + movement.amount, 0);
  const pendingReceivables = receivables.reduce((sum, receivable) => sum + receivable.balance, 0);
  const committedPayments = mockSuppliers.reduce((sum, supplier) => sum + supplier.pendingBalance, 0);
  const availableCash = totalIncome - totalExpenses;
  const projectedCash = availableCash + pendingReceivables - committedPayments;
  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const costOfSales = round(totalRevenue * 0.42, 2);
  const grossMarginAmount = totalRevenue - costOfSales;
  const operatingExpenses = totalExpenses;
  const netProfit = grossMarginAmount - operatingExpenses;
  const stockCostProxy = mockProducts.reduce((sum, product) => sum + product.price * product.quantity * 950, 0);
  const erpBalance = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const statementBalance = totalIncome - totalExpenses;

  return {
    cashFlow: {
      availableCash,
      monthlyIncome: totalIncome,
      monthlyExpenses: totalExpenses,
      netFlow: totalIncome - totalExpenses,
      projectedCash,
      pendingReceivables,
      committedPayments,
      expenseDistribution: expenses.map((expense) => ({
        category: expense.reference ?? "Egreso",
        amount: expense.amount,
        percentage: ratio(expense.amount, totalExpenses),
      })),
      movements: cashMovements,
    },
    profitAndLoss: {
      totalRevenue,
      costOfSales: costOfSales || stockCostProxy * 0.02,
      grossMarginAmount,
      grossMarginPercentage: ratio(grossMarginAmount, totalRevenue),
      operatingExpenses,
      netProfit,
      netMarginPercentage: ratio(netProfit, totalRevenue),
      roiPercentage: ratio(netProfit, Math.max(costOfSales + operatingExpenses, 1)),
    },
    reconciliation: {
      statementBalance,
      erpBalance,
      difference: erpBalance - statementBalance,
      matchedTransactions: mockBankStatements.filter((row) => row.status === "matched").length,
      discrepancyTransactions: mockBankStatements.filter((row) => row.status === "discrepancy").length,
      pendingTransactions: mockBankStatements.filter((row) => row.status === "pending").length,
      totalTransactions: mockBankStatements.length,
      progressPercentage: ratio(
        mockBankStatements.filter((row) => row.status === "matched").length,
        mockBankStatements.length,
      ),
    },
  };
}

export { mockBankStatements, mockERPRecords };
