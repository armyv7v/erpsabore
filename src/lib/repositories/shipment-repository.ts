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
  invoices: Array<{ number: string }> | null;
  customers: Array<{ name: string }> | null;
}

function mapShipment(row: ShipmentRow): ShipmentRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    trackingCode: row.tracking_code,
    carrier: row.carrier,
    customerName: row.customers?.[0]?.name ?? null,
    invoiceNumber: row.invoices?.[0]?.number ?? null,
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
  "id, tenant_id, tracking_code, carrier, origin_address, dest_address, dest_city, scheduled_date, shipped_at, delivered_at, estimated_at, status, notes, created_at, invoices(number), customers(name)";

export async function listShipments(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<ShipmentRecord[]> {
  const { data, error } = await supabase
    .from("shipments")
    .select(SHIPMENT_SELECT)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`No se pudieron cargar los despachos. ${error.message}`.trim());
  }

  return ((data ?? []) as ShipmentRow[]).map(mapShipment);
}
