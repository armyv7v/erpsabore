import type { SupabaseClient } from "@supabase/supabase-js";

export type ProductStockStatus = "normal" | "low" | "out_of_stock";

export interface ProductRecord {
  id: string;
  tenantId: string;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  stockMinQuantity: number;
  stockStatus: ProductStockStatus;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProductRow {
  id: string;
  tenant_id: string;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  unit_price: number | string;
  cost_price: number | string;
  stock_quantity: number;
  stock_min_quantity: number;
  stock_status: ProductStockStatus;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

function numeric(value: number | string): number {
  return typeof value === "string" ? parseFloat(value) : value;
}

function mapProduct(row: ProductRow): ProductRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode || null,
    description: row.description,
    unitPrice: numeric(row.unit_price),
    costPrice: numeric(row.cost_price ?? 0),
    stockQuantity: row.stock_quantity,
    stockMinQuantity: row.stock_min_quantity,
    stockStatus: row.stock_status,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const PRODUCT_SELECT =
  "id, tenant_id, name, sku, barcode, description, unit_price, cost_price, stock_quantity, stock_min_quantity, stock_status, image_url, created_at, updated_at";

export async function listProducts(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<ProductRecord[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar los productos. ${error.message}`.trim());
  }

  return ((data ?? []) as ProductRow[]).map(mapProduct);
}

export async function getProductById(
  supabase: SupabaseClient,
  tenantId: string,
  productId: string,
): Promise<ProductRecord | null> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("tenant_id", tenantId)
    .eq("id", productId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo cargar el producto. ${error.message}`.trim());
  }

  return data ? mapProduct(data as ProductRow) : null;
}

export interface ProductStockSummary {
  /** Total de SKUs activos */
  skuCount: number;
  /** SKUs con stock bajo */
  lowStockCount: number;
  /** SKUs con alerta (bajo + sin stock) */
  stockAlertCount: number;
  /** Valor total del inventario (precio * cantidad) */
  totalInventoryValue: number;
}

export async function getProductStockSummary(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<ProductStockSummary> {
  const { data, error } = await supabase
    .from("products")
    .select("unit_price, stock_quantity, stock_status")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`No se pudo calcular el resumen de inventario. ${error.message}`.trim());
  }

  const rows = (data ?? []) as Pick<ProductRow, "unit_price" | "stock_quantity" | "stock_status">[];

  return {
    skuCount: rows.length,
    lowStockCount: rows.filter((row) => row.stock_status === "low").length,
    stockAlertCount: rows.filter((row) => row.stock_status !== "normal").length,
    totalInventoryValue: rows.reduce(
      (sum, row) => sum + numeric(row.unit_price) * row.stock_quantity,
      0,
    ),
  };
}

export async function updateProductStock(
  supabase: SupabaseClient,
  tenantId: string,
  productId: string,
  newQuantity: number,
): Promise<ProductRecord> {
  if (newQuantity < 0) {
    throw new Error("La cantidad de stock no puede ser negativa.");
  }

  const { data, error } = await supabase
    .from("products")
    .update({
      stock_quantity: newQuantity,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId)
    .eq("id", productId)
    .is("deleted_at", null)
    .select(PRODUCT_SELECT)
    .single();

  if (error || !data) {
    throw new Error(
      `No se pudo actualizar el stock. ${error ? error.message : ""}`.trim(),
    );
  }

  return mapProduct(data as ProductRow);
}

export interface InsertProductInput {
  name: string;
  sku: string;
  barcode?: string | null;
  unitPrice: number;
  costPrice?: number;
  stockQuantity: number;
  stockMinQuantity?: number;
  description?: string | null;
  imageUrl?: string | null;
}

export async function insertProduct(
  supabase: SupabaseClient,
  tenantId: string,
  input: InsertProductInput,
): Promise<ProductRecord> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      tenant_id: tenantId,
      name: input.name,
      sku: input.sku,
      barcode: input.barcode ?? null,
      unit_price: input.unitPrice,
      cost_price: input.costPrice ?? 0,
      stock_quantity: input.stockQuantity,
      stock_min_quantity: input.stockMinQuantity ?? 10,
      description: input.description ?? null,
      image_url: input.imageUrl ?? null,
    })
    .select(PRODUCT_SELECT)
    .single();

  if (error || !data) {
    throw new Error(
      `No se pudo crear el producto. ${error ? error.message : ""}`.trim(),
    );
  }

  return mapProduct(data as ProductRow);
}

export interface UpdateProductInput {
  name: string;
  sku: string;
  barcode?: string | null;
  unitPrice: number;
  costPrice?: number;
  stockMinQuantity?: number;
  description?: string | null;
  imageUrl?: string | null;
}

export async function updateProduct(
  supabase: SupabaseClient,
  tenantId: string,
  productId: string,
  input: UpdateProductInput,
): Promise<ProductRecord> {
  const { data, error } = await supabase
    .from("products")
    .update({
      name: input.name,
      sku: input.sku,
      barcode: input.barcode ?? null,
      unit_price: input.unitPrice,
      cost_price: input.costPrice ?? 0,
      stock_min_quantity: input.stockMinQuantity ?? 10,
      description: input.description ?? null,
      image_url: input.imageUrl ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId)
    .eq("id", productId)
    .is("deleted_at", null)
    .select(PRODUCT_SELECT)
    .single();

  if (error || !data) {
    throw new Error(
      `No se pudo actualizar el producto. ${error ? error.message : ""}`.trim(),
    );
  }

  return mapProduct(data as ProductRow);
}

export async function deleteProduct(
  supabase: SupabaseClient,
  tenantId: string,
  productId: string,
): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId)
    .eq("id", productId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`No se pudo eliminar el producto. ${error.message}`);
  }
}


