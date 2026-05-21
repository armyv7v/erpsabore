import { requireAuthenticatedUser } from "@/lib/services/auth-service";
import { createAuthenticatedSupabaseClient } from "@/lib/services/auth-service";
import { listProducts } from "@/lib/repositories/product-repository";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listCustomers } from "@/lib/repositories/customer-repository";
import { mockCatalogProducts } from "@/data/catalog";
import type { CustomerRecord } from "@/lib/types/erp";
import CatalogClient from "./catalog-client";

async function getCatalogProducts() {
  if (!isSupabaseConfigured()) {
    return mockCatalogProducts.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: p.price,
      stockQuantity: p.stock,
      imageUrl: p.imageUrl,
    }));
  }

  const user = await requireAuthenticatedUser();
  const supabase = await createAuthenticatedSupabaseClient();
  const products = await listProducts(supabase, user.tenantId);

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.description ?? null, // sin categoría en schema actual — usamos description como proxy
    unitPrice: p.unitPrice,
    stockQuantity: p.stockQuantity,
    imageUrl: p.imageUrl,
  }));
}

export default async function CatalogPage() {
  const products = await getCatalogProducts();

  let customers: CustomerRecord[] = [];
  if (isSupabaseConfigured()) {
    try {
      const user = await requireAuthenticatedUser();
      const supabase = await createAuthenticatedSupabaseClient();
      customers = await listCustomers(supabase, user.tenantId);
    } catch (err) {
      console.error("Error al cargar clientes para el catálogo:", err);
    }
  }

  return <CatalogClient products={products} customers={customers} />;
}
