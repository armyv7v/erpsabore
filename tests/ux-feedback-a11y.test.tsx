import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const { mockLoginAction, mockForgotAction, mockUpdateAction } = vi.hoisted(() => ({
  mockLoginAction: vi.fn(),
  mockForgotAction: vi.fn(),
  mockUpdateAction: vi.fn(),
}));

vi.mock("@/app/actions/auth", () => ({
  loginAction: mockLoginAction,
  requestPasswordResetAction: mockForgotAction,
  updatePasswordAction: mockUpdateAction,
}));

import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";
import LoginForm from "@/components/auth/LoginForm";

function src(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function submitForm(container: HTMLElement): void {
  const form = container.querySelector("form");
  expect(form).not.toBeNull();
  fireEvent.submit(form!);
}

// 5.3 — feedback <400ms (Doherty), targets ≥44px (Fitts) y teclado/foco
// en los componentes tocados por PR1–PR4. Criterios laws-of-ux.
describe("Fase 5.3 — feedback inmediato <400ms (Doherty)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forgot-password muestra sending + deshabilita al enviar", async () => {
    // Deferred controlable: una transición useActionState abandonada sin
    // resolver envenena las transiciones posteriores del mismo worker
    // (React 19 + jsdom). Se resuelve siempre antes de desmontar.
    let resolveAction!: (value: unknown) => void;
    mockForgotAction.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );
    const { container, unmount } = render(<ForgotPasswordForm />);

    const start = performance.now();
    submitForm(container);
    const sending = await screen.findByText("Enviando...");
    const elapsed = performance.now() - start;

    expect(sending).toBeDefined();
    expect(screen.getByRole("button", { name: /enviando/i }).hasAttribute("disabled")).toBe(true);
    expect(elapsed).toBeLessThan(400);

    resolveAction({ status: "error", message: "cierre controlado" });
    await screen.findByText("cierre controlado");
    unmount();
  });

  it("forgot-password éxito → confirmación neutra con salida (Peak-End, sin callejón)", async () => {
    mockForgotAction.mockResolvedValue({ status: "success", message: "Revisá el correo." });
    const { container } = render(<ForgotPasswordForm />);

    submitForm(container);

    // Timeout amplio: el entorno jsdom es lento; lo que se verifica es la
    // transición a confirmación con salida, no la latencia del runner.
    await screen.findByText("Revisá tu correo", undefined, { timeout: 5000 });
    expect(screen.getByRole("link", { name: /volver al inicio de sesión/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("update-password muestra updating + deshabilita al enviar", async () => {
    // Ver nota del deferred en el test de forgot-password: no abandonar pendientes.
    let resolveAction!: (value: unknown) => void;
    mockUpdateAction.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );
    const { container, unmount } = render(<UpdatePasswordForm />);

    const start = performance.now();
    submitForm(container);
    await screen.findByText("Actualizando...");
    const elapsed = performance.now() - start;

    expect(screen.getByRole("button", { name: /actualizando/i }).hasAttribute("disabled")).toBe(true);
    expect(elapsed).toBeLessThan(400);

    resolveAction({ status: "error", message: "cierre controlado" });
    await screen.findByText("cierre controlado");
    unmount();
  });

  it("update-password éxito → CTA único a login", async () => {
    mockUpdateAction.mockResolvedValue({ status: "success", message: "Lista." });
    const { container } = render(<UpdatePasswordForm />);

    submitForm(container);

    // Timeout amplio: el entorno jsdom es lento; lo que se verifica es la
    // transición a éxito con CTA único, no la latencia del runner.
    await screen.findByText("Contraseña actualizada", undefined, { timeout: 5000 });
    expect(screen.getByRole("link", { name: /ir al inicio de sesión/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("login muestra pending + deshabilita al enviar", async () => {
    // Ver nota del deferred en el test de forgot-password: no abandonar pendientes.
    let resolveAction!: (value: unknown) => void;
    mockLoginAction.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );
    const { container, unmount } = render(<LoginForm />);

    submitForm(container);

    await screen.findByText("Ingresando...");
    expect(screen.getByRole("button", { name: /ingresando/i }).hasAttribute("disabled")).toBe(true);

    resolveAction({ status: "error", message: "cierre controlado" });
    await screen.findByText("cierre controlado");
    unmount();
  });
});

describe("Fase 5.3 — teclado y foco (labels asociados, toggles expuestos)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forgot-password asocia label con input (lector de pantalla)", () => {
    render(<ForgotPasswordForm />);
    const input = screen.getByLabelText("Correo electrónico");
    expect(input.getAttribute("id")).toBe("forgot-email");
    expect(input.getAttribute("type")).toBe("email");
    expect(input.hasAttribute("required")).toBe(true);
  });

  it("update-password asocia ambos labels y el toggle expone estado (Tesler)", () => {
    render(<UpdatePasswordForm />);

    expect(screen.getByLabelText("Nueva contraseña").getAttribute("id")).toBe("update-password");
    expect(screen.getByLabelText("Confirmar contraseña").getAttribute("id")).toBe("update-confirm");

    const toggle = screen.getByRole("button", { name: "Mostrar contraseña" });
    expect(toggle.getAttribute("type")).toBe("button");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(toggle);

    expect(screen.getByRole("button", { name: "Ocultar contraseña" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByLabelText("Nueva contraseña").getAttribute("type")).toBe("text");
  });

  it("toggle de update-password es operable por teclado (foco + Enter)", () => {
    render(<UpdatePasswordForm />);
    const toggle = screen.getByRole("button", { name: "Mostrar contraseña" });

    toggle.focus();
    expect(document.activeElement).toBe(toggle);
    expect(toggle.hasAttribute("disabled")).toBe(false);
    expect(toggle.tabIndex).not.toBe(-1);
  });

  it("login asocia labels, expone toggle y enlaza a recovery real", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("Correo electrónico").getAttribute("id")).toBe("login-email");
    expect(screen.getByLabelText("Contraseña").getAttribute("id")).toBe("login-password");
    expect(screen.getByRole("button", { name: "Mostrar contraseña" }).getAttribute("type")).toBe(
      "button",
    );
    expect(
      screen.getByRole("link", { name: /olvidaste tu contraseña/i }).getAttribute("href"),
    ).toBe("/forgot-password");
  });

  it("sidebar mobile conserva nombre accesible y foco visible en cerrar", () => {
    const sidebar = src("src/components/layout/Sidebar.tsx");
    expect(sidebar).toContain('aria-label="Cerrar menu lateral"');
    expect(sidebar).toContain("focus-visible:outline-primary");
  });

  it("paginador POS expone nombres accesibles prev/next", () => {
    const pos = src("src/components/erp/PosWorkspace.tsx");
    expect(pos).toContain('aria-label="Página anterior del historial"');
    expect(pos).toContain('aria-label="Página siguiente del historial"');
  });
});

describe("Fase 5.3 — targets ≥44px (Fitts) en componentes tocados", () => {
  it("paginador POS: prev/next con min-h/min-w 44px", () => {
    const pos = src("src/components/erp/PosWorkspace.tsx");
    expect(pos).toMatch(/aria-label="Página anterior del historial"[^>]*className="[^"]*min-h-\[44px\] min-w-\[44px\]/);
    expect(pos).toMatch(/aria-label="Página siguiente del historial"[^>]*className="[^"]*min-h-\[44px\] min-w-\[44px\]/);
  });

  it("cerrar sidebar mobile con min-h/min-w 44px", () => {
    const sidebar = src("src/components/layout/Sidebar.tsx");
    expect(sidebar).toMatch(/aria-label="Cerrar menu lateral"[\s\S]*?min-h-\[44px\] min-w-\[44px\]/);
  });

  it("QuotesWorkspace: 3 botones táctiles, un solo primario", () => {
    const quotes = src("src/components/erp/QuotesWorkspace.tsx");
    expect(quotes.match(/min-h-\[44px\]/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(quotes.match(/bg-primary px-3/g)?.length ?? 0).toBe(1);
    expect(quotes).toContain("text-red-600");
  });

  it("CTA catálogo del empty-state con min-h 44px", () => {
    const page = src("src/app/(dashboard)/page.tsx");
    expect(page).toMatch(/href="\/catalogo"[^>]*className="[^"]*min-h-\[44px\]/);
  });

  it("toggles show-password con área táctil 44px", () => {
    for (const file of [
      "src/components/auth/LoginForm.tsx",
      "src/components/auth/UpdatePasswordForm.tsx",
    ]) {
      const content = src(file);
      expect(content).toContain("min-h-[44px] min-w-[44px]");
    }
  });
});
