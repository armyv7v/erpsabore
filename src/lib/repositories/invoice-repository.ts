import type { SupabaseClient } from "@supabase/supabase-js";
import { LocalDteAdapter } from "@/lib/dte/local-dte-adapter";
import type {
  AccountsReceivableRecord,
  CashMovementRecord,
  CashMovementStatus,
  InvoiceLineRecord,
  InvoiceRecord,
  InvoiceStatus,
  ReceivableStatus,
} from "@/lib/types/erp";

interface InvoiceItemRow {
  id: string;
  invoice_id: string;
  tenant_id: string;
  product_id: string | null;
  description: string;
  qty: number | string;
  unit_price: number | string;
  line_total: number | string;
}

interface CustomerRow {
  id: string;
  name: string;
  rut: string;
}

interface InvoiceTableRow {
  id: string;
  tenant_id: string;
  customer_id: string;
  number: string;
  issue_date: string;
  due_date: string;
  currency: string;
  notes: string | null;
  subtotal: number | string;
  tax: number | string;
  total: number | string;
  status: InvoiceStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  dte_type?: number;
  dte_status?: "none" | "pending" | "accepted" | "rejected" | "failed";
  dte_xml_url?: string | null;
  dte_pdf_url?: string | null;
  dte_sii_message?: string | null;
  sii_track_id?: string | null;
}

interface InvoiceRow extends InvoiceTableRow {
  customer: CustomerRow;
  invoice_items: InvoiceItemRow[];
}

interface ReceivableRow {
  id: string;
  tenant_id: string;
  invoice_id: string;
  balance: number | string;
  status: ReceivableStatus;
  due_date: string;
  last_payment_at: string | null;
}

interface CashMovementRow {
  id: string;
  tenant_id: string;
  source_type: string;
  source_id: string | null;
  kind: "income" | "expense";
  amount: number | string;
  movement_date: string;
  reference: string | null;
  payment_method: string | null;
  status: CashMovementStatus;
  created_at: string;
}

function numeric(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function mapInvoiceItems(items: InvoiceItemRow[] | null | undefined): InvoiceLineRecord[] {
  return (items ?? []).map((item) => ({
    id: item.id,
    invoiceId: item.invoice_id,
    tenantId: item.tenant_id,
    productId: item.product_id,
    description: item.description,
    qty: numeric(item.qty),
    unitPrice: numeric(item.unit_price),
    lineTotal: numeric(item.line_total),
  }));
}

function mapInvoice(row: InvoiceRow, outstandingBalance: number): InvoiceRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    customerId: row.customer_id,
    customerName: row.customer.name,
    customerRut: row.customer.rut,
    number: row.number,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    currency: row.currency,
    notes: row.notes,
    subtotal: numeric(row.subtotal),
    tax: numeric(row.tax),
    total: numeric(row.total),
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: mapInvoiceItems(row.invoice_items),
    outstandingBalance,
    dteType: row.dte_type,
    dteStatus: row.dte_status,
    dteXmlUrl: row.dte_xml_url,
    dtePdfUrl: row.dte_pdf_url,
    dteSiiMessage: row.dte_sii_message,
    siiTrackId: row.sii_track_id,
  };
}

const invoiceTableSelect =
  "id, tenant_id, customer_id, number, issue_date, due_date, currency, notes, subtotal, tax, total, status, created_by, created_at, updated_at, dte_type, dte_status, dte_xml_url, dte_pdf_url, dte_sii_message, sii_track_id";

async function loadInvoiceRow(
  supabase: SupabaseClient,
  tenantId: string,
  invoiceId: string,
) {
  const { data, error } = await supabase
    .from("invoices")
    .select(invoiceTableSelect)
    .eq("tenant_id", tenantId)
    .eq("id", invoiceId)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo consultar la factura. ${error.message}`.trim());
  }

  return (data as InvoiceTableRow | null) ?? null;
}

async function loadHydratedInvoice(
  supabase: SupabaseClient,
  tenantId: string,
  invoiceId: string,
) {
  const invoice = await loadInvoiceRow(supabase, tenantId, invoiceId);

  if (!invoice) {
    return null;
  }

  const [{ data: customer, error: customerError }, { data: invoiceItems, error: itemsError }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id, name, rut")
        .eq("tenant_id", tenantId)
        .eq("id", invoice.customer_id)
        .maybeSingle(),
      supabase
        .from("invoice_items")
        .select("id, invoice_id, tenant_id, product_id, description, qty, unit_price, line_total")
        .eq("tenant_id", tenantId)
        .eq("invoice_id", invoiceId)
        .order("description", { ascending: true }),
    ]);

  if (customerError) {
    throw new Error(`No se pudo cargar el cliente de la factura. ${customerError.message}`.trim());
  }

  if (!customer) {
    throw new Error("No se encontro el cliente asociado a la factura.");
  }

  if (itemsError) {
    throw new Error(`No se pudieron cargar las lineas de la factura. ${itemsError.message}`.trim());
  }

  return {
    ...invoice,
    customer: customer as CustomerRow,
    invoice_items: (invoiceItems ?? []) as InvoiceItemRow[],
  } satisfies InvoiceRow;
}

function mapReceivable(row: ReceivableRow): AccountsReceivableRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    invoiceId: row.invoice_id,
    balance: numeric(row.balance),
    status: row.status,
    dueDate: row.due_date,
    lastPaymentAt: row.last_payment_at,
  };
}

function mapCashMovement(row: CashMovementRow): CashMovementRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    kind: row.kind,
    amount: numeric(row.amount),
    movementDate: row.movement_date,
    reference: row.reference,
    paymentMethod: row.payment_method,
    status: row.status,
    createdAt: row.created_at,
  };
}

export interface ListInvoicesOptions {
  /** Número de página base-0. Default: 0 */
  page?: number;
  /** Facturas por página. Default: 50. Máximo recomendado: 200. */
  pageSize?: number;
}

export interface PaginatedInvoices {
  invoices: Awaited<ReturnType<typeof listInvoices>>["invoices"];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export async function listInvoices(
  supabase: SupabaseClient,
  tenantId: string,
  options: ListInvoicesOptions = {},
) {
  const page = options.page ?? 0;
  const pageSize = Math.min(options.pageSize ?? 50, 200);
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("invoices")
    .select(invoiceTableSelect, { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`No se pudieron cargar las facturas. ${error.message}`.trim());
  }

  const invoiceRows = ((data ?? []) as InvoiceTableRow[]) ?? [];
  const totalCount = count ?? 0;

  if (invoiceRows.length === 0) {
    return {
      invoices: [],
      totalCount,
      page,
      pageSize,
      pageCount: Math.ceil(totalCount / pageSize),
    };
  }

  const customerIds = [...new Set(invoiceRows.map((row) => row.customer_id))];
  const invoiceIds = invoiceRows.map((row) => row.id);
  const [
    { data: customers, error: customersError },
    { data: invoiceItems, error: itemsError },
    { data: receivablesData, error: receivablesError },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, rut")
      .eq("tenant_id", tenantId)
      .in("id", customerIds),
    supabase
      .from("invoice_items")
      .select("id, invoice_id, tenant_id, product_id, description, qty, unit_price, line_total")
      .eq("tenant_id", tenantId)
      .in("invoice_id", invoiceIds),
    supabase
      .from("accounts_receivable")
      .select("id, tenant_id, invoice_id, balance, status, due_date, last_payment_at")
      .eq("tenant_id", tenantId)
      .in("invoice_id", invoiceIds),
  ]);

  if (customersError) {
    throw new Error(`No se pudieron cargar los clientes de las facturas. ${customersError.message}`.trim());
  }

  if (itemsError) {
    throw new Error(`No se pudieron cargar las lineas de las facturas. ${itemsError.message}`.trim());
  }

  if (receivablesError) {
    throw new Error(`No se pudieron cargar las cuentas por cobrar de las facturas. ${receivablesError.message}`.trim());
  }

  const receivables = ((receivablesData ?? []) as ReceivableRow[]).map(mapReceivable);

  const customerById = new Map(((customers ?? []) as CustomerRow[]).map((customer) => [customer.id, customer]));
  const itemsByInvoiceId = new Map<string, InvoiceItemRow[]>();

  for (const item of (invoiceItems ?? []) as InvoiceItemRow[]) {
    const currentItems = itemsByInvoiceId.get(item.invoice_id) ?? [];
    currentItems.push(item);
    itemsByInvoiceId.set(item.invoice_id, currentItems);
  }

  const balanceByInvoiceId = new Map(receivables.map((receivable) => [receivable.invoiceId, receivable.balance]));

  const invoices = invoiceRows.map((row) =>
    mapInvoice(
      {
        ...row,
        customer: customerById.get(row.customer_id) ?? {
          id: row.customer_id,
          name: "Cliente no disponible",
          rut: "-",
        },
        invoice_items: itemsByInvoiceId.get(row.id) ?? [],
      },
      balanceByInvoiceId.get(row.id) ?? 0,
    ),
  );

  return {
    invoices,
    totalCount,
    page,
    pageSize,
    pageCount: Math.ceil(totalCount / pageSize),
  };
}

export async function getInvoiceById(
  supabase: SupabaseClient,
  tenantId: string,
  invoiceId: string,
) {
  const data = await loadHydratedInvoice(supabase, tenantId, invoiceId);

  if (!data) {
    throw new Error("No se pudo cargar la factura solicitada.");
  }

  const receivable = await getReceivableByInvoiceId(supabase, tenantId, invoiceId);
  return mapInvoice(data, receivable?.balance ?? 0);
}

export async function insertInvoiceItems(
  supabase: SupabaseClient,
  input: Array<{
    tenantId: string;
    invoiceId: string;
    productId?: string | null;
    description: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
  }>,
) {
  const { error } = await supabase.from("invoice_items").insert(
    input.map((item) => ({
      tenant_id: item.tenantId,
      invoice_id: item.invoiceId,
      product_id: item.productId ?? null,
      description: item.description,
      qty: item.qty,
      unit_price: item.unitPrice,
      line_total: item.lineTotal,
    })),
  );

  if (error) {
    throw new Error("No se pudieron guardar las lineas de la factura.");
  }
}

export async function updateInvoiceStatus(
  supabase: SupabaseClient,
  tenantId: string,
  invoiceId: string,
  status: InvoiceStatus,
) {
  const { error } = await supabase
    .from("invoices")
    .update({ status })
    .eq("tenant_id", tenantId)
    .eq("id", invoiceId);

  if (error) {
    throw new Error("No se pudo actualizar el estado de la factura.");
  }
}

export async function listReceivables(supabase: SupabaseClient, tenantId: string) {
  const { data, error } = await supabase
    .from("accounts_receivable")
    .select("id, tenant_id, invoice_id, balance, status, due_date, last_payment_at")
    .eq("tenant_id", tenantId);

  if (error) {
    throw new Error("No se pudieron cargar las cuentas por cobrar.");
  }

  return ((data ?? []) as ReceivableRow[]).map(mapReceivable);
}

export async function getReceivableByInvoiceId(
  supabase: SupabaseClient,
  tenantId: string,
  invoiceId: string,
) {
  const { data, error } = await supabase
    .from("accounts_receivable")
    .select("id, tenant_id, invoice_id, balance, status, due_date, last_payment_at")
    .eq("tenant_id", tenantId)
    .eq("invoice_id", invoiceId)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo cargar la cuenta por cobrar de la factura.");
  }

  return data ? mapReceivable(data as ReceivableRow) : null;
}

export async function createReceivable(
  supabase: SupabaseClient,
  input: {
    tenantId: string;
    invoiceId: string;
    balance: number;
    status: ReceivableStatus;
    dueDate: string;
  },
) {
  const { data, error } = await supabase
    .from("accounts_receivable")
    .insert({
      tenant_id: input.tenantId,
      invoice_id: input.invoiceId,
      balance: input.balance,
      status: input.status,
      due_date: input.dueDate,
    })
    .select("id, tenant_id, invoice_id, balance, status, due_date, last_payment_at")
    .single();

  if (error || !data) {
    throw new Error("No se pudo crear la cuenta por cobrar.");
  }

  return mapReceivable(data as ReceivableRow);
}

export async function updateReceivable(
  supabase: SupabaseClient,
  tenantId: string,
  receivableId: string,
  input: { balance: number; status: ReceivableStatus; lastPaymentAt: string | null },
) {
  const { data, error } = await supabase
    .from("accounts_receivable")
    .update({
      balance: input.balance,
      status: input.status,
      last_payment_at: input.lastPaymentAt,
    })
    .eq("tenant_id", tenantId)
    .eq("id", receivableId)
    .select("id, tenant_id, invoice_id, balance, status, due_date, last_payment_at")
    .single();

  if (error || !data) {
    throw new Error("No se pudo actualizar la cuenta por cobrar.");
  }

  return mapReceivable(data as ReceivableRow);
}

export async function listCashMovements(supabase: SupabaseClient, tenantId: string) {
  const { data, error } = await supabase
    .from("cash_movements")
    .select("id, tenant_id, source_type, source_id, kind, amount, movement_date, reference, payment_method, status, created_at")
    .eq("tenant_id", tenantId)
    .order("movement_date", { ascending: false });

  if (error) {
    throw new Error("No se pudieron cargar los movimientos de caja.");
  }

  return ((data ?? []) as CashMovementRow[]).map(mapCashMovement);
}

export async function createCashMovement(
  supabase: SupabaseClient,
  input: {
    tenantId: string;
    sourceType: string;
    sourceId?: string | null;
    kind: "income" | "expense";
    amount: number;
    movementDate: string;
    reference?: string | null;
    paymentMethod?: string | null;
    status: CashMovementStatus;
    createdBy: string;
  },
) {
  const { data, error } = await supabase
    .from("cash_movements")
    .insert({
      tenant_id: input.tenantId,
      source_type: input.sourceType,
      source_id: input.sourceId ?? null,
      kind: input.kind,
      amount: input.amount,
      movement_date: input.movementDate,
      reference: input.reference ?? null,
      payment_method: input.paymentMethod ?? null,
      status: input.status,
      created_by: input.createdBy,
    })
    .select("id, tenant_id, source_type, source_id, kind, amount, movement_date, reference, payment_method, status, created_at")
    .single();

  if (error) {
    throw new Error(`No se pudo registrar el movimiento de caja. Detalle: ${error.message}`);
  }
  if (!data) {
    throw new Error("No se pudo registrar el movimiento de caja (datos vacíos).");
  }

  return mapCashMovement(data as CashMovementRow);
}

export async function updateCashMovementStatus(
  supabase: SupabaseClient,
  input: {
    tenantId: string;
    movementIds: string[];
    status: CashMovementStatus;
  },
) {
  if (input.movementIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("cash_movements")
    .update({
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", input.tenantId)
    .in("id", input.movementIds)
    .select("id, tenant_id, source_type, source_id, kind, amount, movement_date, reference, payment_method, status, created_at");

  if (error) {
    throw new Error("No se pudieron actualizar los movimientos de conciliacion.");
  }

  return ((data ?? []) as CashMovementRow[]).map(mapCashMovement);
}

export async function createDraftInvoiceWithCustomerRpc(
  supabase: SupabaseClient,
  input: {
    customerName: string;
    customerRut: string;
    customerEmail?: string | null;
    issueDate: string;
    dueDate: string;
    currency: string;
    notes?: string | null;
    taxRate: number;
    items: Array<{
      productId?: string | null;
      description: string;
      qty: number;
      unitPrice: number;
    }>;
  },
) {
  const { data, error } = await supabase.rpc("create_draft_invoice_with_customer", {
    customer_name: input.customerName,
    customer_rut: input.customerRut,
    customer_email: input.customerEmail ?? null,
    issue_date: input.issueDate,
    due_date: input.dueDate,
    invoice_currency: input.currency,
    invoice_notes: input.notes ?? null,
    invoice_tax_rate: input.taxRate,
    invoice_items: input.items,
  });

  if (error || !data) {
    throw new Error(`No se pudo crear la factura. ${error ? error.message : ""}`.trim());
  }

  return data as string;
}

export async function issueInvoiceRpc(
  supabase: SupabaseClient,
  invoiceId: string,
) {
  // 1. Emitir la factura en base de datos mediante el RPC seguro
  const { data, error } = await supabase.rpc("issue_invoice_secure", {
    target_invoice_id: invoiceId,
  });

  if (error || !data) {
    throw new Error(`No se pudo emitir la factura. ${error ? error.message : ""}`.trim());
  }

  // 2. Ejecutar el flujo de procesamiento DTE (simulado interactivo)
  try {
    // Obtener los datos necesarios para generar el XML del DTE
    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .select(`
        id,
        number,
        issue_date,
        due_date,
        subtotal,
        tax,
        total,
        dte_type,
        customers (
          name,
          rut,
          email
        ),
        invoice_items (
          product_id,
          description,
          qty,
          unit_price,
          line_total
        )
      `)
      .eq("id", invoiceId)
      .single();

    if (invErr || !inv) {
      console.error("[DTE] No se pudieron leer los detalles de la factura emitida para generar el DTE:", invErr);
      await supabase
        .from("invoices")
        .update({
          dte_status: "failed",
          dte_sii_message: "Error al leer datos para la generación del DTE."
        })
        .eq("id", invoiceId);
    } else {
      const typedInv = inv as any;
      const dteItems = (typedInv.invoice_items || []).map((it: any) => ({
        product_id: it.product_id,
        description: it.description,
        qty: Number(it.qty),
        unit_price: Number(it.unit_price),
        line_total: Number(it.line_total)
      }));

      const dteCustomer = {
        name: typedInv.customers?.name || "Cliente Genérico",
        rut: typedInv.customers?.rut || "11.111.111-1",
        email: typedInv.customers?.email || null
      };

      // Instanciar adaptador e iniciar flujo
      const dteAdapter = new LocalDteAdapter();
      
      // Actualizar a estado 'pending' (transmisión al SII iniciada)
      await supabase
        .from("invoices")
        .update({ dte_status: "pending" })
        .eq("id", invoiceId);

      const dteResult = await dteAdapter.processInvoice(
        {
          id: typedInv.id,
          number: typedInv.number,
          issue_date: typedInv.issue_date,
          due_date: typedInv.due_date,
          subtotal: Number(typedInv.subtotal),
          tax: Number(typedInv.tax),
          total: Number(typedInv.total),
          dte_type: typedInv.dte_type
        },
        dteItems,
        dteCustomer
      );

      if (dteResult.success) {
        // Guardar URLs de descarga y estado accepted
        await supabase
          .from("invoices")
          .update({
            dte_status: "accepted",
            dte_xml_url: dteResult.xmlUrl,
            dte_pdf_url: dteResult.pdfUrl,
            sii_track_id: dteResult.trackId,
            dte_sii_message: dteResult.siiMessage
          })
          .eq("id", invoiceId);
      } else {
        // Registrar fallo
        await supabase
          .from("invoices")
          .update({
            dte_status: "failed",
            dte_sii_message: dteResult.error || "Fallo en el procesamiento DTE."
          })
          .eq("id", invoiceId);
      }
    }
  } catch (dteErr: any) {
    console.error("[DTE Background error] Fallo en el pipeline DTE:", dteErr);
    try {
      await supabase
        .from("invoices")
        .update({
          dte_status: "failed",
          dte_sii_message: `Excepción en adaptador DTE: ${dteErr.message || dteErr}`
        })
        .eq("id", invoiceId);
    } catch (e: any) {
      console.error("Error actualizando dte_status fallido:", e);
    }
  }

  return data as string;
}

export async function registerInvoicePaymentRpc(
  supabase: SupabaseClient,
  input: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    reference?: string | null;
    method?: string | null;
  },
) {
  const { data, error } = await supabase.rpc("register_invoice_payment_secure", {
    target_invoice_id: input.invoiceId,
    payment_amount: input.amount,
    payment_date_value: input.paymentDate,
    payment_reference: input.reference ?? null,
    payment_method_value: input.method ?? null,
  });

  if (error || !data) {
    throw new Error(`No se pudo registrar el pago. ${error ? error.message : ""}`.trim());
  }

  return data as string;
}

export interface BillingTotals {
  totalIssued: number;
  totalOutstanding: number;
  draftCount: number;
  issuedCount: number;
}

export async function getGlobalInvoicesStats(
  supabase: SupabaseClient,
  tenantId: string,
) {
  const [invoicesRes, receivablesRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, total, status")
      .eq("tenant_id", tenantId),
    supabase
      .from("accounts_receivable")
      .select("invoice_id, balance")
      .eq("tenant_id", tenantId),
  ]);

  if (invoicesRes.error) {
    throw new Error(`Error al obtener datos globales de facturas: ${invoicesRes.error.message}`);
  }
  if (receivablesRes.error) {
    throw new Error(`Error al obtener saldos por cobrar globales: ${receivablesRes.error.message}`);
  }

  const balanceByInvoiceId = new Map(
    (receivablesRes.data ?? []).map((r) => [r.invoice_id, Number(r.balance)]),
  );

  const summary = {
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
  };

  const totals: BillingTotals = {
    totalIssued: 0,
    totalOutstanding: 0,
    draftCount: 0,
    issuedCount: 0,
  };

  for (const inv of invoicesRes.data ?? []) {
    const total = Number(inv.total);
    const outstandingBalance = balanceByInvoiceId.get(inv.id) ?? 0;
    const isCommitted = ["issued", "partially_paid", "paid", "overdue"].includes(inv.status);

    // Sales Summary
    if (inv.status === "paid") {
      summary.totalPaid += total;
      summary.paidCount += 1;
    } else if (inv.status === "overdue") {
      summary.totalOverdue += outstandingBalance;
      summary.overdueCount += 1;
    } else {
      summary.totalPending += outstandingBalance || total;
      summary.pendingCount += 1;
    }

    // Billing Totals
    if (isCommitted) {
      totals.totalIssued += total;
    }
    
    totals.totalOutstanding += outstandingBalance;

    if (inv.status === "draft") {
      totals.draftCount += 1;
    }

    if (["issued", "partially_paid", "paid"].includes(inv.status)) {
      totals.issuedCount += 1;
    }
  }

  return { summary, totals };
}
