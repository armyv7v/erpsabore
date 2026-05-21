import { requireAuthenticatedUser } from "@/lib/services/auth-service";
import { createAuthenticatedSupabaseClient } from "@/lib/services/auth-service";
import { listShipments } from "@/lib/repositories/shipment-repository";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockShipments } from "@/data/shipping";
import ShipmentsClient from "./shipments-client";

function mockToRecord(s: typeof mockShipments[number]) {
  const statusMap: Record<string, string> = {
    "In Transit": "in_transit",
    "Processing": "pending",
    "Delivered": "delivered",
    "Returned": "failed",
  };
  return {
    id: s.id,
    tenantId: "mock",
    trackingCode: s.trackingNumber,
    carrier: s.carrier,
    customerName: s.customerName,
    invoiceNumber: null,
    originAddress: s.origin ?? null,
    destAddress: s.destination ?? "—",
    destCity: null,
    scheduledDate: null,
    shippedAt: null,
    deliveredAt: null,
    estimatedAt: null,
    status: (statusMap[s.status] ?? "pending") as "pending" | "in_transit" | "delivered" | "failed" | "cancelled",
    notes: s.issue ?? null,
    createdAt: new Date().toISOString(),
  };
}

async function getShipments() {
  if (!isSupabaseConfigured()) {
    return mockShipments.map(mockToRecord);
  }
  const user = await requireAuthenticatedUser();
  const supabase = await createAuthenticatedSupabaseClient();
  return listShipments(supabase, user.tenantId);
}

export default async function ShippingPage() {
  const shipments = await getShipments();
  return <ShipmentsClient shipments={shipments} />;
}