import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const { mockRequestReset, mockUpdatePw } = vi.hoisted(() => ({
  mockRequestReset: vi.fn(),
  mockUpdatePw: vi.fn(),
}));

vi.mock("@/lib/services/auth-service", () => ({
  requestPasswordReset: mockRequestReset,
  updateRecoveryPassword: mockUpdatePw,
  signInWithPassword: vi.fn(),
  signOutCurrentUser: vi.fn(),
}));

import { requestPasswordResetAction, updatePasswordAction } from "@/app/actions/auth";

const IDLE = { status: "idle" as const, message: "" };

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

// 5.1 — actions con servicio mockeado: éxito neutro anti-enumeración,
// DEP ausente, sin sesión. Sin credenciales reales.
describe("Fase 5.1 — requestPasswordResetAction (REQ-AR-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("éxito → mensaje neutro anti-enumeración (Peak-End, misma vista)", async () => {
    mockRequestReset.mockResolvedValue(undefined);

    const state = await requestPasswordResetAction(IDLE, formData({ email: "usuario@ejemplo.cl" }));

    expect(state.status).toBe("success");
    expect(mockRequestReset).toHaveBeenCalledWith("usuario@ejemplo.cl");
    // Neutro: no revela si la cuenta existe
    expect(state.message).toMatch(/Si existe una cuenta/);
    expect(state.message).not.toContain("usuario@ejemplo.cl");
  });

  it("el mensaje de éxito es idéntico exista o no el usuario (no enumera)", async () => {
    mockRequestReset.mockResolvedValue(undefined);

    const a = await requestPasswordResetAction(IDLE, formData({ email: "existe@ejemplo.cl" }));
    const b = await requestPasswordResetAction(IDLE, formData({ email: "nadie-xyz-999@ejemplo.cl" }));

    expect(a).toEqual(b);
  });

  it("DEP ausente (SMTP) → error que nombra la dependencia, sin éxito", async () => {
    mockRequestReset.mockRejectedValue(
      new Error("Recuperación no disponible: falta DEP-02 — Supabase/SMTP no está configurado."),
    );

    const state = await requestPasswordResetAction(IDLE, formData({ email: "usuario@ejemplo.cl" }));

    expect(state.status).toBe("error");
    expect(state.message).toMatch(/DEP-02/);
  });

  it("email malformado → error de validación sin llamar al servicio", async () => {
    const state = await requestPasswordResetAction(IDLE, formData({ email: "no-es-un-email" }));

    expect(state.status).toBe("error");
    expect(mockRequestReset).not.toHaveBeenCalled();
  });
});

describe("Fase 5.1 — updatePasswordAction (REQ-AR-02)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("claves coincidentes → éxito con salida a login", async () => {
    mockUpdatePw.mockResolvedValue(undefined);

    const state = await updatePasswordAction(
      IDLE,
      formData({ password: "clave1234", confirm: "clave1234" }),
    );

    expect(state.status).toBe("success");
    expect(mockUpdatePw).toHaveBeenCalledWith("clave1234");
    expect(state.message).toMatch(/iniciar sesión/);
  });

  it("confirmación distinta → error inline sin intentar el cambio", async () => {
    const state = await updatePasswordAction(
      IDLE,
      formData({ password: "clave1234", confirm: "otra1234" }),
    );

    expect(state.status).toBe("error");
    expect(mockUpdatePw).not.toHaveBeenCalled();
  });

  it("sin sesión (link expirado) → error de expirado con retorno a solicitud", async () => {
    mockUpdatePw.mockRejectedValue(
      new Error("El enlace expiró o es inválido. Solicitá un nuevo enlace de recuperación."),
    );

    const state = await updatePasswordAction(
      IDLE,
      formData({ password: "clave1234", confirm: "clave1234" }),
    );

    expect(state.status).toBe("error");
    expect(state.message).toMatch(/expiró o es inválido/);
  });
});
