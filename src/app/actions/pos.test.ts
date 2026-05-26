import { describe, it, expect, vi } from "vitest";
import { submitPosSaleAction } from "./pos";

// Mocking required auth services and supabase configs
vi.mock("@/lib/services/auth-service", () => ({
  requireAuthenticatedContext: vi.fn().mockResolvedValue({
    user: { id: "user-1", tenantId: "tenant-1", role: "admin" },
    supabase: {},
  }),
}));

vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: vi.fn().mockReturnValue(false), // fallback local mode for unit tests
}));

describe("POS Sale Server Action Unit Tests", () => {
  it("should fail when customer rut is missing", async () => {
    const formData = new FormData();
    formData.append("customerName", "Test Customer");
    formData.append("dteType", "39");
    formData.append("paymentMethod", "cash");
    formData.append("amountPaid", "100");
    formData.append("itemsJson", "[]");

    const result = await submitPosSaleAction({ status: "idle", message: "" }, formData);
    expect(result.status).toBe("error");
    expect(result.message).toContain("El RUT del cliente es obligatorio");
  });

  it("should fail when cart is empty", async () => {
    const formData = new FormData();
    formData.append("customerName", "Test Customer");
    formData.append("customerRut", "11.111.111-1");
    formData.append("dteType", "39");
    formData.append("paymentMethod", "cash");
    formData.append("amountPaid", "100");
    formData.append("itemsJson", "[]");

    const result = await submitPosSaleAction({ status: "idle", message: "" }, formData);
    expect(result.status).toBe("error");
    expect(result.message).toContain("El carrito está vacío");
  });

  it("should successfully process a valid cash sale in mock/fallback mode", async () => {
    const formData = new FormData();
    formData.append("customerName", "Cliente General");
    formData.append("customerRut", "66.666.666-6");
    formData.append("dteType", "39");
    formData.append("paymentMethod", "cash");
    formData.append("amountPaid", "10000");

    const items = [
      { productId: "1", name: "Rollo Kraft 20 cms", qty: 2, unitPrice: 5000 }
    ];
    formData.append("itemsJson", JSON.stringify(items));

    const result = await submitPosSaleAction({ status: "idle", message: "" }, formData);
    expect(result.status).toBe("success");
    expect(result.dteResult).toBeDefined();
    expect(result.dteResult.total).toBe(10000);
    expect(result.dteResult.change).toBe(0);
    expect(result.dteResult.folio).toBeDefined();
  });
});

describe("WhatsApp Raw-Text POS Parser Logic", () => {
  it("should correctly parse standard WhatsApp text layout", () => {
    const whatsAppText = `*1x Rollo Kraft 20 cms - $5.000*
*2x Vaso polipapel blanco 8 oz x 50 und - $49*`;

    // Simple test mock of the parsing logic inside PosWorkspace
    const lines = whatsAppText.split("\n");
    const parsed: Array<{ name: string; qty: number }> = [];

    lines.forEach((line) => {
      const cleanLine = line.replace(/[*_~]/g, "").trim();
      const matchQty = cleanLine.match(/^(\d+)\s*(?:x|und|unidades|unds)?\s+(.+)$/i);
      
      if (matchQty) {
        const qty = parseInt(matchQty[1]);
        const namePart = matchQty[2].trim().toLowerCase();
        parsed.push({ name: namePart, qty });
      }
    });

    expect(parsed.length).toBe(2);
    expect(parsed[0].qty).toBe(1);
    expect(parsed[0].name).toContain("rollo kraft 20 cms");
    expect(parsed[1].qty).toBe(2);
    expect(parsed[1].name).toContain("vaso polipapel blanco 8 oz");
  });
});
