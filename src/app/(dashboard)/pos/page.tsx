import { Suspense } from "react";
import { requireAuthenticatedUser, createAuthenticatedSupabaseClient } from "@/lib/services/auth-service";
import { listProducts } from "@/lib/repositories/product-repository";
import { listBranches } from "@/lib/repositories/branch-repository";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockProducts } from "@/data/inventory";
import { mockBranches } from "@/data/branches";
import PosWorkspace from "@/components/erp/PosWorkspace";

async function getPosData() {
  if (!isSupabaseConfigured()) {
    // Fallback local
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
      branches: mockBranches.map((b) => ({
        id: b.id,
        name: b.name,
      })),
    };
  }

  const user = await requireAuthenticatedUser();
  const supabase = await createAuthenticatedSupabaseClient();

  const [products, branches] = await Promise.all([
    listProducts(supabase, user.tenantId).catch(() => []),
    listBranches(supabase, user.tenantId).catch(() => []),
  ]);

  return {
    products,
    branches: branches.map((b) => ({ id: b.id, name: b.name })),
  };
}

export default async function PosPage() {
  const { products, branches } = await getPosData();

  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Iniciando Consola POS...</div>}>
      <PosWorkspace products={products} branches={branches} />
    </Suspense>
  );
}
