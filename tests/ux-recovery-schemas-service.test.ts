import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const { mockIsConfigured, mockCreateClient } = vi.hoisted(() => ({
  mockIsConfigured: vi.fn(),
  mockCreateClient: vi.fn(),
}));

vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: mockIsConfigured,
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mockCreateClient,
}));

import { forgotPasswordSchema, updatePasswordSchema } from "@/lib/validators/auth";
import { requestPasswordReset, updateRecoveryPassword } from "@/lib/services/auth-service";

// 5.1 — schemas zod (REQ-AR-01/02) + servicio con Supabase mockeado
// (DEP ausente, sin sesión, éxito). Sin credenciales reales.
describe("Fase 5.1 — schemas de recovery (REQ-AR-01/02)", () => {
  it("acepta un email válido", () => {
    const parsed = forgotPasswordSchema.parse({ email: "usuario@ejemplo.cl" });
    expect(parsed.email).toBe("usuario@ejemplo.cl");
  });

  it("normaliza con trim + lower (Postel: acepta con espacios y mayúsculas)", () => {
    const parsed = forgotPasswordSchema.parse({ email: "  Usuario@Ejemplo.CL  " });
    expect(parsed.email).toBe("usuario@ejemplo.cl");
  });

  it("rechaza email malformado sin emitir request", () => {
    const result = forgotPasswordSchema.safeParse({ email: "no-es-un-email" });
    expect(result.success).toBe(false);
  });

  it("rechaza email vacío", () => {
    const result = forgotPasswordSchema.safeParse({ email: "   " });
    expect(result.success).toBe(false);
  });

  it("acepta claves coincidentes de ≥8 caracteres", () => {
    const parsed = updatePasswordSchema.parse({ password: "clave1234", confirm: "clave1234" });
    expect(parsed.password).toBe("clave1234");
  });

  it("rechaza clave menor a 8 caracteres", () => {
    const result = updatePasswordSchema.safeParse({ password: "corta7", confirm: "corta7" });
    expect(result.success).toBe(false);
  });

  it("rechaza confirmación distinta con error en el campo confirm", () => {
    const result = updatePasswordSchema.safeParse({ password: "clave1234", confirm: "otra1234" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toContain("confirm");
    }
  });
});

describe("Fase 5.1 — servicio recovery con Supabase mockeado (REQ-AR-01/02/03-guarda)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.APP_URL;
  });

  it("requestPasswordReset sin Supabase → error que nombra DEP-02", async () => {
    mockIsConfigured.mockReturnValue(false);
    await expect(requestPasswordReset("usuario@ejemplo.cl")).rejects.toThrow(/DEP-02/);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("requestPasswordReset sin APP_URL → error que nombra DEP-01", async () => {
    mockIsConfigured.mockReturnValue(true);
    await expect(requestPasswordReset("usuario@ejemplo.cl")).rejects.toThrow(/DEP-01/);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("requestPasswordReset configurado → llama resetPasswordForEmail con redirectTo al callback", async () => {
    mockIsConfigured.mockReturnValue(true);
    process.env.NEXT_PUBLIC_APP_URL = "https://app.test/";
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockResolvedValue({ auth: { resetPasswordForEmail } });

    await requestPasswordReset("usuario@ejemplo.cl");

    expect(resetPasswordForEmail).toHaveBeenCalledWith("usuario@ejemplo.cl", {
      redirectTo: "https://app.test/auth/callback?next=/update-password",
    });
  });

  it("requestPasswordReset propaga el error de Supabase (red/servicio)", async () => {
    mockIsConfigured.mockReturnValue(true);
    process.env.NEXT_PUBLIC_APP_URL = "https://app.test";
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: new Error("SMTP caído") });
    mockCreateClient.mockResolvedValue({ auth: { resetPasswordForEmail } });

    await expect(requestPasswordReset("usuario@ejemplo.cl")).rejects.toThrow("SMTP caído");
  });

  it("updateRecoveryPassword sin Supabase → error que nombra DEP-02", async () => {
    mockIsConfigured.mockReturnValue(false);
    await expect(updateRecoveryPassword("clave1234")).rejects.toThrow(/DEP-02/);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("updateRecoveryPassword sin sesión → error de enlace expirado/inválido", async () => {
    mockIsConfigured.mockReturnValue(true);
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });

    await expect(updateRecoveryPassword("clave1234")).rejects.toThrow(/expiró o es inválido/);
  });

  it("updateRecoveryPassword con sesión válida → actualiza la clave", async () => {
    mockIsConfigured.mockReturnValue(true);
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u-1" } } }),
        updateUser,
      },
    });

    await updateRecoveryPassword("clave1234");

    expect(updateUser).toHaveBeenCalledWith({ password: "clave1234" });
  });
});
