"use server";

import { requireAuthenticatedContext } from "@/lib/services/auth-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockInvoices } from "@/data/sales";
import { mockProducts } from "@/data/inventory";

export interface SalesReportItem {
  id: string;
  number: string;
  issueDate: string;
  customerName: string;
  customerRut: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
}

export interface ShiftReportItem {
  id: string;
  openedAt: string;
  closedAt: string | null;
  openedBy: string;
  closedBy: string | null;
  branchName: string;
  initialCash: number;
  expectedCash: number;
  expectedDebit: number;
  expectedCredit: number;
  expectedTransfer: number;
  expectedTotal: number;
  actualCash: number;
  actualDebit: number;
  actualCredit: number;
  actualTransfer: number;
  actualTotal: number;
  difference: number;
  notes: string | null;
  status: string;
}

export interface InventoryReportItem {
  id: string;
  sku: string;
  name: string;
  stockQuantity: number;
  stockMinQuantity: number;
  stockStatus: "normal" | "low" | "out_of_stock";
  costPrice: number;
  unitPrice: number;
  totalCostValue: number;
  totalRetailValue: number;
}

// Action para reportes de ventas
export async function getSalesReportData(
  startDate?: string,
  endDate?: string
): Promise<{ status: "success" | "error"; data: SalesReportItem[]; message?: string }> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();

    if (!isSupabaseConfigured()) {
      // Filtrar mock invoices por rango de fecha
      let data = mockInvoices.map((inv) => ({
        id: inv.id,
        number: inv.folio,
        issueDate: inv.date,
        customerName: inv.clientName,
        customerRut: inv.rut,
        subtotal: Math.round(inv.amount / 1.19),
        tax: Math.round((inv.amount / 1.19) * 0.19),
        total: inv.amount,
        status: inv.status,
      }));

      if (startDate) {
        data = data.filter((inv) => inv.issueDate >= startDate);
      }
      if (endDate) {
        data = data.filter((inv) => inv.issueDate <= endDate);
      }

      return { status: "success", data };
    }

    let query = supabase
      .from("invoices")
      .select(`
        id,
        number,
        issue_date,
        subtotal,
        tax,
        total,
        status,
        customers (
          name,
          rut
        )
      `)
      .eq("tenant_id", user.tenantId)
      .in("status", ["issued", "partially_paid", "paid", "overdue"]);

    if (startDate) {
      query = query.gte("issue_date", startDate);
    }
    if (endDate) {
      query = query.lte("issue_date", endDate);
    }

    const { data: dbInvoices, error } = await query.order("issue_date", { ascending: false });

    if (error) {
      throw new Error(`Error al consultar facturas: ${error.message}`);
    }

    const data: SalesReportItem[] = (dbInvoices ?? []).map((inv: any) => ({
      id: inv.id,
      number: inv.number,
      issueDate: inv.issue_date,
      customerName: inv.customers?.name || "Cliente Genérico",
      customerRut: inv.customers?.rut || "-",
      subtotal: Number(inv.subtotal),
      tax: Number(inv.tax),
      total: Number(inv.total),
      status: inv.status,
    }));

    return { status: "success", data };
  } catch (error: any) {
    console.error("[getSalesReportData Action Error]:", error);
    return { status: "error", data: [], message: error.message || "Error al generar reporte de ventas." };
  }
}

// Action para cierres de caja / jornadas
export async function getPosShiftReportData(
  startDate?: string,
  endDate?: string
): Promise<{ status: "success" | "error"; data: ShiftReportItem[]; message?: string }> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();

    if (!isSupabaseConfigured()) {
      // Mock data para desarrollo local
      const mockShifts: ShiftReportItem[] = [
        {
          id: "shift-1",
          openedAt: "2026-06-28T09:00:00Z",
          closedAt: "2026-06-28T18:00:00Z",
          openedBy: "Juan Pérez (Cajero)",
          closedBy: "Juan Pérez (Cajero)",
          branchName: "Casa Matriz",
          initialCash: 50000,
          expectedCash: 125000,
          expectedDebit: 80000,
          expectedCredit: 45000,
          expectedTransfer: 30000,
          expectedTotal: 280000,
          actualCash: 125000,
          actualDebit: 80000,
          actualCredit: 45000,
          actualTransfer: 30000,
          actualTotal: 280000,
          difference: 0,
          notes: "Cierre cuadrado sin novedades.",
          status: "closed",
        },
        {
          id: "shift-2",
          openedAt: "2026-06-29T09:00:00Z",
          closedAt: "2026-06-29T18:30:00Z",
          openedBy: "María López (Cajera)",
          closedBy: "María López (Cajera)",
          branchName: "Sucursal Providencia",
          initialCash: 50000,
          expectedCash: 185000,
          expectedDebit: 110000,
          expectedCredit: 60000,
          expectedTransfer: 20000,
          expectedTotal: 375000,
          actualCash: 184500,
          actualDebit: 110000,
          actualCredit: 60000,
          actualTransfer: 20000,
          actualTotal: 374500,
          difference: -500,
          notes: "Faltaron 500 pesos en efectivo al arqueo.",
          status: "closed",
        }
      ];

      let data = mockShifts;
      if (startDate) {
        data = data.filter((s) => s.closedAt && s.closedAt >= startDate);
      }
      if (endDate) {
        data = data.filter((s) => s.closedAt && s.closedAt <= endDate);
      }

      return { status: "success", data };
    }

    // Consultar cierres de caja en Supabase
    let query = supabase
      .from("cash_shifts")
      .select("*")
      .eq("tenant_id", user.tenantId)
      .eq("status", "closed");

    if (startDate) {
      query = query.gte("closed_at", startDate);
    }
    if (endDate) {
      query = query.lte("closed_at", endDate);
    }

    const { data: dbShifts, error: shiftError } = await query.order("closed_at", { ascending: false });

    if (shiftError) {
      throw new Error(`Error al consultar jornadas: ${shiftError.message}`);
    }

    // Obtener perfiles y sucursales para mapear en JS de forma segura
    const [profilesRes, branchesRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name").eq("tenant_id", user.tenantId),
      supabase.from("branches").select("id, name").eq("tenant_id", user.tenantId),
    ]);

    const profileMap = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p.full_name]));
    const branchMap = new Map((branchesRes.data ?? []).map((b: any) => [b.id, b.name]));

    const data: ShiftReportItem[] = (dbShifts ?? []).map((s: any) => {
      const initialCash = Number(s.initial_cash);
      const expectedCash = Number(s.expected_cash);
      const expectedDebit = Number(s.expected_debit);
      const expectedCredit = Number(s.expected_credit);
      const expectedTransfer = Number(s.expected_transfer);
      
      const actualCash = Number(s.actual_cash);
      const actualDebit = Number(s.actual_debit);
      const actualCredit = Number(s.actual_credit);
      const actualTransfer = Number(s.actual_transfer);

      const expectedTotal = expectedCash + expectedDebit + expectedCredit + expectedTransfer;
      const actualTotal = actualCash + actualDebit + actualCredit + actualTransfer;

      return {
        id: s.id,
        openedAt: s.opened_at,
        closedAt: s.closed_at,
        openedBy: profileMap.get(s.opened_by) || "Usuario desconocido",
        closedBy: profileMap.get(s.closed_by) || "Usuario desconocido",
        branchName: branchMap.get(s.branch_id) || "Casa Matriz",
        initialCash,
        expectedCash,
        expectedDebit,
        expectedCredit,
        expectedTransfer,
        expectedTotal,
        actualCash,
        actualDebit,
        actualCredit,
        actualTransfer,
        actualTotal,
        difference: actualTotal - expectedTotal,
        notes: s.notes,
        status: s.status,
      };
    });

    return { status: "success", data };
  } catch (error: any) {
    console.error("[getPosShiftReportData Action Error]:", error);
    return { status: "error", data: [], message: error.message || "Error al generar reporte de cierres." };
  }
}

// Action para control de inventario
export async function getInventoryReportData(): Promise<{
  status: "success" | "error";
  data: InventoryReportItem[];
  message?: string;
}> {
  try {
    const { user, supabase } = await requireAuthenticatedContext();

    if (!isSupabaseConfigured()) {
      // Mock data
      const data: InventoryReportItem[] = mockProducts.map((p) => {
        const qty = p.quantity;
        const price = p.price;
        const cost = Math.round(price * 0.55); // Costo estimado de desarrollo local
        return {
          id: p.id,
          sku: p.sku,
          name: p.name,
          stockQuantity: qty,
          stockMinQuantity: 10,
          stockStatus: p.status as "normal" | "low" | "out_of_stock",
          costPrice: cost,
          unitPrice: price,
          totalCostValue: qty * cost,
          totalRetailValue: qty * price,
        };
      });

      return { status: "success", data };
    }

    const { data: dbProducts, error } = await supabase
      .from("products")
      .select("id, sku, name, stock_quantity, stock_min_quantity, stock_status, cost_price, unit_price")
      .eq("tenant_id", user.tenantId)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Error al consultar productos: ${error.message}`);
    }

    const data: InventoryReportItem[] = (dbProducts ?? []).map((p: any) => {
      const qty = Number(p.stock_quantity);
      const cost = Number(p.cost_price ?? 0);
      const price = Number(p.unit_price ?? 0);

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        stockQuantity: qty,
        stockMinQuantity: Number(p.stock_min_quantity),
        stockStatus: p.stock_status,
        costPrice: cost,
        unitPrice: price,
        totalCostValue: qty * cost,
        totalRetailValue: qty * price,
      };
    });

    return { status: "success", data };
  } catch (error: any) {
    console.error("[getInventoryReportData Action Error]:", error);
    return { status: "error", data: [], message: error.message || "Error al obtener reporte de inventario." };
  }
}
