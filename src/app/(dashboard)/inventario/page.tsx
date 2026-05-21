"use server";

import { Suspense } from "react";
import { requireAuthenticatedUser, createAuthenticatedSupabaseClient } from "@/lib/services/auth-service";
import {
  listProducts,
  getProductStockSummary,
} from "@/lib/repositories/product-repository";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockProducts } from "@/data/inventory";
import InventoryClient from "./inventory-client";

async function getInventoryData() {
  if (!isSupabaseConfigured()) {
    // Fallback a mock durante desarrollo local sin Supabase
    return {
      products: mockProducts.map((p) => ({
        id: p.id,
        tenantId: "mock",
        name: p.name,
        sku: p.sku,
        description: null,
        unitPrice: p.price,
        stockQuantity: p.quantity,
        stockMinQuantity: 10,
        stockStatus: p.status as "normal" | "low" | "out_of_stock",
        imageUrl: p.imageUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      summary: {
        skuCount: mockProducts.length,
        lowStockCount: mockProducts.filter((p) => p.status === "low").length,
        stockAlertCount: mockProducts.filter((p) => p.status !== "normal").length,
        totalInventoryValue: mockProducts.reduce(
          (sum, p) => sum + p.price * p.quantity,
          0,
        ),
      },
    };
  }

  const user = await requireAuthenticatedUser();
  const supabase = await createAuthenticatedSupabaseClient();

  const [products, summary] = await Promise.all([
    listProducts(supabase, user.tenantId).catch(() => []),
    getProductStockSummary(supabase, user.tenantId).catch(() => ({
      skuCount: 0,
      lowStockCount: 0,
      stockAlertCount: 0,
      totalInventoryValue: 0,
    })),
  ]);

  return { products, summary };
}

export default async function InventoryPage() {
  const { products, summary } = await getInventoryData();

  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Cargando inventario...</div>}>
      <InventoryClient products={products} summary={summary} />
    </Suspense>
  );
}
