import { getOptionalAuthUser, createAuthenticatedSupabaseClient } from "@/lib/services/auth-service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { listProducts } from "@/lib/repositories/product-repository";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listCustomers } from "@/lib/repositories/customer-repository";
import { mockCatalogProducts } from "@/data/catalog";
import type { CustomerRecord } from "@/lib/types/erp";
import { getMajorCategory } from "@/lib/utils/barcode-generator";
import CatalogClient from "./catalog-client";
import DashboardShell from "@/components/layout/DashboardShell";
import Link from "next/link";
import Image from "next/image";

const SABORE_DEFAULT_TENANT_ID = "211edcae-b525-4d11-9413-1f659d5e846b";

async function getCatalogProducts(user: any) {
  if (!isSupabaseConfigured()) {
    const categoryCounters: Record<string, number> = {};
    return mockCatalogProducts.map((p) => {
      const category = getMajorCategory(p.name);
      if (!categoryCounters[category]) {
        categoryCounters[category] = 0;
      }
      categoryCounters[category]++;
      const sequence = String(categoryCounters[category]).padStart(4, "0");
      
      const catIndex = category === "Plásticos" ? "01" : category === "Papel" ? "02" : "03";
      
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

  // Si hay usuario logueado, usar su cliente e ID de tenant
  if (user) {
    const supabase = await createAuthenticatedSupabaseClient();
    const products = await listProducts(supabase, user.tenantId);
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      category: getMajorCategory(p.name),
      unitPrice: p.unitPrice,
      stockQuantity: p.stockQuantity,
      imageUrl: p.imageUrl,
    }));
  }

  // Si es un invitado, usar el admin client con bypass de RLS y el tenant por defecto
  const adminSupabase = createSupabaseAdminClient();
  const products = await listProducts(adminSupabase, SABORE_DEFAULT_TENANT_ID);
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    category: getMajorCategory(p.name),
    unitPrice: p.unitPrice,
    stockQuantity: p.stockQuantity,
    imageUrl: p.imageUrl,
  }));
}

export default async function CatalogPage() {
  const user = await getOptionalAuthUser();
  const products = await getCatalogProducts(user);

  let customers: CustomerRecord[] = [];
  if (isSupabaseConfigured() && user) {
    try {
      const supabase = await createAuthenticatedSupabaseClient();
      customers = await listCustomers(supabase, user.tenantId);
    } catch (err) {
      console.error("Error al cargar clientes para el catálogo:", err);
    }
  }

  if (user) {
    // Si está autenticado, renderizar con el DashboardShell corporativo
    return (
      <DashboardShell user={user}>
        <CatalogClient products={products} customers={customers} user={user} />
      </DashboardShell>
    );
  }

  // Si es invitado/cliente sin sesión, renderizar con layout público simplificado
  return (
    <div className="min-h-screen bg-background-light dark:bg-[#221610] text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header público de la tienda */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#221610]/70 backdrop-blur-md sticky top-0 z-30 transition-colors">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <picture className="block h-10 w-auto">
            <source srcSet="/brand/logo_blanco_sin_fondo.png" media="(prefers-color-scheme: dark)" />
            <img src="/brand/logo_camel_sin_fondo.png" alt="Saboré Insumos" className="h-10 w-auto object-contain" />
          </picture>
          
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-bold text-slate-650 hover:text-slate-900 dark:text-slate-350 dark:hover:text-slate-100 transition-colors px-3 py-2">
              Iniciar Sesión
            </Link>
            <Link href="/registro" className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-md shadow-primary/20 transition-all hover:scale-[1.02]">
              Registrarse
            </Link>
          </div>
        </div>
      </header>
      
      {/* Contenido del catálogo */}
      <div className="flex-1 w-full mx-auto max-w-7xl px-4 py-8">
        <CatalogClient products={products} customers={customers} user={null} />
      </div>
    </div>
  );
}
