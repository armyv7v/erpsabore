import type { SupabaseClient } from "@supabase/supabase-js";

export type ShipmentStatus =
  | "pending"
  | "in_transit"
  | "delivered"
  | "failed"
  | "cancelled";

export interface ShipmentRecord {
  id: string;
  tenantId: string;
  trackingCode: string | null;
  carrier: string | null;
  customerName: string | null;
  invoiceNumber: string | null;
  items: Array<{ description: string; qty: number }> | null;
  originAddress: string | null;
  destAddress: string;
  destCity: string | null;
  scheduledDate: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  estimatedAt: string | null;
  status: ShipmentStatus;
  notes: string | null;
  createdAt: string;
}

interface ShipmentRow {
  id: string;
  tenant_id: string;
  tracking_code: string | null;
  carrier: string | null;
  origin_address: string | null;
  dest_address: string;
  dest_city: string | null;
  scheduled_date: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  estimated_at: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  invoices: any;
  customers: any;
}

function mapShipment(row: ShipmentRow): ShipmentRecord {
  const invoice = Array.isArray(row.invoices) ? row.invoices[0] : row.invoices;
  const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;

  return {
    id: row.id,
    tenantId: row.tenant_id,
    trackingCode: row.tracking_code,
    carrier: row.carrier,
    customerName: customer?.name ?? null,
    invoiceNumber: invoice?.number ?? null,
    items: invoice?.invoice_items?.map((item: any) => ({
      description: item.description,
      qty: Number(item.qty),
    })) ?? null,
    originAddress: row.origin_address,
    destAddress: row.dest_address,
    destCity: row.dest_city,
    scheduledDate: row.scheduled_date,
    shippedAt: row.shipped_at,
    deliveredAt: row.delivered_at,
    estimatedAt: row.estimated_at,
    status: (row.status ?? "pending") as ShipmentStatus,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

const SHIPMENT_SELECT =
  "id, tenant_id, tracking_code, carrier, origin_address, dest_address, dest_city, scheduled_date, shipped_at, delivered_at, estimated_at, status, notes, created_at, invoices(number, invoice_items(description, qty)), customers(name)";

export async function listShipments(
  supabase: SupabaseClient,
  tenantId: string,
  options?: { customerId?: string }
): Promise<ShipmentRecord[]> {
  let query = supabase
    .from("shipments")
    .select(SHIPMENT_SELECT)
    .eq("tenant_id", tenantId);

  if (options?.customerId) {
    query = query.eq("customer_id", options.customerId);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`No se pudieron cargar los despachos. ${error.message}`.trim());
  }

  return ((data ?? []) as ShipmentRow[]).map(mapShipment);
}
