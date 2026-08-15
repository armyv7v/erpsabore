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
    items: null,
    createdAt: new Date().toISOString(),
  };
}

async function getShipments(user: any) {
  if (!isSupabaseConfigured()) {
    return mockShipments.map(mockToRecord);
  }
  const supabase = await createAuthenticatedSupabaseClient();
  const filterOptions = user.role === "cliente" ? { customerId: user.customerId ?? undefined } : undefined;
  return listShipments(supabase, user.tenantId, filterOptions);
}

export default async function ShippingPage() {
  let shipments: any[] = [];
  let userRole = "cliente";
  if (isSupabaseConfigured()) {
    const user = await requireAuthenticatedUser();
    userRole = user.role;
    shipments = await getShipments(user);
  } else {
    shipments = mockShipments.map(mockToRecord);
  }
  return <ShipmentsClient shipments={shipments} userRole={userRole} />;
}