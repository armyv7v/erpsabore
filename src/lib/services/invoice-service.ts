import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getFallbackCustomers, getFallbackInvoices, getFallbackReceivables } from "@/lib/mock/fallback-data";
import { listCustomers } from "@/lib/repositories/customer-repository";
import {
  createDraftInvoiceWithCustomerRpc,
  getGlobalInvoicesStats,
  issueInvoiceRpc,
  listCashMovements,
  listInvoices,
  listReceivables,
  registerInvoicePaymentRpc,
} from "@/lib/repositories/invoice-repository";
import { createInvoiceSchema, registerPaymentSchema } from "@/lib/validators/invoices";
import { getProductStockSummary } from "@/lib/repositories/product-repository";
import type {
  AuthUser,
  CreateInvoiceInput,
  InvoiceRecord,
  RegisterPaymentInput,
  SalesSummary,
} from "@/lib/types/erp";
import { assertUserHasRole, createAuthenticatedSupabaseClient } from "@/lib/services/auth-service";

function isCommittedInvoice(invoice: InvoiceRecord) {
  return ["issued", "partially_paid", "paid", "overdue"].includes(invoice.status);
}

function buildSalesSummary(invoices: InvoiceRecord[]): SalesSummary {
  return invoices.reduce<SalesSummary>(
    (summary, invoice) => {
      if (invoice.status === "paid") {
        summary.totalPaid += invoice.total;
        summary.paidCount += 1;
      } else if (invoice.status === "overdue") {
        summary.totalOverdue += invoice.outstandingBalance;
        summary.overdueCount += 1;
      } else {
        summary.totalPending += invoice.outstandingBalance || invoice.total;
        summary.pendingCount += 1;
      }

      return summary;
    },
    {
      totalPaid: 0,
      totalPending: 0,
      totalOverdue: 0,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0,
    },
  );
}

export async function getSalesWorkspace(
  user: AuthUser,
  options: { page?: number; pageSize?: number } = {},
  supabaseClient?: SupabaseClient,
) {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 10;

  if (!isSupabaseConfigured()) {
    const invoices = getFallbackInvoices();
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const paginatedInvoices = invoices.slice(from, to);

    return {
      invoices: paginatedInvoices,
      customers: getFallbackCustomers(),
      summary: buildSalesSummary(invoices),
      totals: {
        totalIssued: invoices.filter(isCommittedInvoice).reduce((sum, invoice) => sum + invoice.total, 0),
        totalOutstanding: invoices.reduce((sum, invoice) => sum + invoice.outstandingBalance, 0),
        draftCount: invoices.filter((invoice) => invoice.status === "draft").length,
        issuedCount: invoices.filter((invoice) => ["issued", "partially_paid", "paid"].includes(invoice.status)).length,
      },
      totalCount: invoices.length,
      page,
      pageSize,
      pageCount: Math.ceil(invoices.length / pageSize),
    };
  }

  const supabase = supabaseClient ?? await createAuthenticatedSupabaseClient();
  const repoPage = page - 1;

  const [{ invoices, totalCount, pageCount }, customers, stats] = await Promise.all([
    listInvoices(supabase, user.tenantId, { page: repoPage, pageSize }),
    listCustomers(supabase, user.tenantId),
    getGlobalInvoicesStats(supabase, user.tenantId),
  ]);

  return {
    invoices,
    customers,
    summary: stats.summary,
    totals: stats.totals,
    totalCount,
    page,
    pageSize,
    pageCount,
  };
}

export async function getBillingWorkspace(
  user: AuthUser,
  options: { page?: number; pageSize?: number } = {},
  supabaseClient?: SupabaseClient,
) {
  const workspace = await getSalesWorkspace(user, options, supabaseClient);
  return workspace;
}

export async function createDraftInvoice(
  user: AuthUser,
  input: CreateInvoiceInput,
  supabaseClient?: SupabaseClient,
) {
  assertUserHasRole(user, ["admin", "ventas", "finanzas"]);
  const parsedInput = createInvoiceSchema.parse(input);

  if (process.env.PLAYWRIGHT_TEST_BYPASS === "true") {
    return "mock-e2e-invoice-id";
  }

  if (!isSupabaseConfigured()) {
    throw new Error("Configura Supabase para crear facturas reales.");
  }

  const supabase = supabaseClient ?? await createAuthenticatedSupabaseClient();
  const invoiceId = await createDraftInvoiceWithCustomerRpc(supabase, {
    customerName: parsedInput.customer.name,
    customerRut: parsedInput.customer.rut,
    customerEmail: parsedInput.customer.email ?? null,
    issueDate: parsedInput.issueDate,
    dueDate: parsedInput.dueDate,
    currency: parsedInput.currency,
    notes: parsedInput.notes ?? null,
    taxRate: parsedInput.taxRate ?? 0.19,
    items: parsedInput.items.map((item) => ({
      productId: item.productId ?? null,
      description: item.description,
      qty: item.qty,
      unitPrice: item.unitPrice,
    })),
  });



  return invoiceId;
}

export async function issueInvoice(
  user: AuthUser,
  invoiceId: string,
  supabaseClient?: SupabaseClient,
) {
  assertUserHasRole(user, ["admin", "ventas", "finanzas"]);

  if (process.env.PLAYWRIGHT_TEST_BYPASS === "true") {
    return;
  }

  if (!isSupabaseConfigured()) {
    throw new Error("Configura Supabase para emitir facturas reales.");
  }

  const supabase = supabaseClient ?? await createAuthenticatedSupabaseClient();
  await issueInvoiceRpc(supabase, invoiceId);
}

export async function registerInvoicePayment(
  user: AuthUser,
  input: RegisterPaymentInput,
  supabaseClient?: SupabaseClient,
) {
  assertUserHasRole(user, ["admin", "ventas", "finanzas"]);
  const parsedInput = registerPaymentSchema.parse(input);

  if (process.env.PLAYWRIGHT_TEST_BYPASS === "true") {
    return {
      paymentId: "mock-e2e-payment-id",
    };
  }

  if (!isSupabaseConfigured()) {
    throw new Error("Configura Supabase para registrar pagos reales.");
  }

  const supabase = supabaseClient ?? await createAuthenticatedSupabaseClient();
  return registerInvoicePaymentRpc(supabase, {
    invoiceId: parsedInput.invoiceId,
    amount: parsedInput.amount,
    paymentDate: parsedInput.paymentDate,
    reference: parsedInput.reference,
    method: parsedInput.method,
  });
}

export async function getFinanceSourceData(user: AuthUser, supabaseClient?: SupabaseClient) {
  if (!isSupabaseConfigured()) {
    const invoices = getFallbackInvoices();
    return {
      invoices,
      receivables: getFallbackReceivables(),
      cashMovements: [],
      inventoryValue: 0,
      totals: {
        totalIssued: invoices.filter(isCommittedInvoice).reduce((sum, invoice) => sum + invoice.total, 0),
        totalOutstanding: invoices.reduce((sum, invoice) => sum + invoice.outstandingBalance, 0),
        draftCount: invoices.filter((invoice) => invoice.status === "draft").length,
        issuedCount: invoices.filter((invoice) => ["issued", "partially_paid", "paid"].includes(invoice.status)).length,
      },
    };
  }

  const supabase = supabaseClient ?? await createAuthenticatedSupabaseClient();
  const [stats, receivables, cashMovements, stockSummary] = await Promise.all([
    getGlobalInvoicesStats(supabase, user.tenantId),
    listReceivables(supabase, user.tenantId),
    listCashMovements(supabase, user.tenantId),
    getProductStockSummary(supabase, user.tenantId),
  ]);

  return {
    invoices: [] as InvoiceRecord[],
    receivables,
    cashMovements,
    inventoryValue: stockSummary.totalInventoryValue,
    totals: stats.totals,
  };
}
