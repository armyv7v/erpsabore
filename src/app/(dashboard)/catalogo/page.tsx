import { requireAuthenticatedUser } from "@/lib/services/auth-service";
import { createAuthenticatedSupabaseClient } from "@/lib/services/auth-service";
import { listProducts } from "@/lib/repositories/product-repository";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listCustomers } from "@/lib/repositories/customer-repository";
import { mockCatalogProducts } from "@/data/catalog";
import type { CustomerRecord } from "@/lib/types/erp";
import { getProductCategory, PRODUCT_CATEGORIES } from "@/lib/utils/barcode-generator";
import CatalogClient from "./catalog-client";

async function getCatalogProducts() {
  if (!isSupabaseConfigured()) {
    const categoryCounters: Record<string, number> = {};
    return mockCatalogProducts.map((p) => {
      const category = getProductCategory(p.name);
      if (!categoryCounters[category]) {
        categoryCounters[category] = 0;
      }
      categoryCounters[category]++;
      const sequence = String(categoryCounters[category]).padStart(4, "0");
      
      const catIndex = String(
        Math.max(1, PRODUCT_CATEGORIES.findIndex((c) => c.name === category) + 1)
      ).padStart(2, "0");
      
      const base12 = `780123${catIndex}${sequence}`;
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        const digit = parseInt(base12[i], 10);
        sum += i % 2 === 0 ? digit * 1 : digit * 3;
      }
      const checkDigit = (10 - (sum % 10)) % 10;
      const barcode = `${base12}${checkDigit}`;

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode,
        category,
        unitPrice: p.price,
        stockQuantity: p.stock,
        imageUrl: p.imageUrl,
      };
    });
  }

  const user = await requireAuthenticatedUser();
  const supabase = await createAuthenticatedSupabaseClient();
  const products = await listProducts(supabase, user.tenantId);

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    category: getProductCategory(p.name),
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
