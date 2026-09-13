import { describe, it, expect } from "vitest";
import { buildCsv } from "../src/lib/utils/export-utils";

describe("buildCsv (reemplazo de exportacion xlsx)", () => {
  it("incluye BOM UTF-8 para que Excel es-CL detecte los acentos", () => {
    const csv = buildCsv([["SKU", "Nombre"], ["ABC-1", "Sabor Ñandú"]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("Sabor Ñandú");
  });

  it("usa delimitador ; (estándar de Excel en locale es-CL)", () => {
    const csv = buildCsv([["SKU", "Total"], ["ABC-1", "$1.000"]]);
    const body = csv.slice(1); // sin BOM
    expect(body).toBe("SKU;Total\r\nABC-1;$1.000");
  });

  it("escapa campos que contienen delimitador, comillas o saltos de línea", () => {
    const csv = buildCsv([
      ["Cliente", "Nota"],
      ['Ferretería "El Sur"', "Dos líneas\ncon ; punto y coma"],
    ]);
    const body = csv.slice(1);
    expect(body).toBe(
      'Cliente;Nota\r\n"Ferretería ""El Sur""";"Dos líneas\ncon ; punto y coma"'
    );
  });
});
