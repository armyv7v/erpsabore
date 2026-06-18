import { describe, it, expect, vi } from "vitest";
import { 
  calculateIvaForPeriod,
  calculatePpmForPeriod,
  calculatePrevired
} from "@/lib/services/taxes-service";

// Mock del repositorio de empleados para aislar la base de datos
vi.mock("@/lib/repositories/employee-repository", () => ({
  listEmployees: vi.fn().mockResolvedValue([
    {
      id: "emp-1",
      fullName: "Andrés Silva",
      roleName: "Gerente de Ventas",
      baseSalary: 1000000,
      contractType: "indefinite",
      afpName: "Modelo", // Comisión: 0.58%
      healthSystem: "fonasa",
      status: "active"
    },
    {
      id: "emp-2",
      fullName: "Carolina Méndez",
      roleName: "Jefa de Operaciones",
      baseSalary: 800000,
      contractType: "fixed_term",
      afpName: "Habitat", // Comisión: 1.27%
      healthSystem: "isapre",
      status: "active"
    },
    {
      id: "emp-3",
      fullName: "Ricardo Tapia",
      roleName: "Analista Inactivo",
      baseSalary: 600000,
      contractType: "indefinite",
      afpName: "Uno",
      healthSystem: "fonasa",
      status: "inactive" // No debe sumarse al cálculo de Previred
    }
  ])
}));

describe("Módulo de Cálculo de Impuestos y Previsión Chilena", () => {
  describe("Cálculos de Previred", () => {
    it("debe calcular correctamente los descuentos de empleados y costos de empresa", async () => {
      const mockSupabase = {} as any;
      const result = await calculatePrevired(mockSupabase, "tenant-id-123");

      // Solo los 2 trabajadores activos deben ser calculados
      expect(result.employees.length).toBe(2);

      // Empleado 1: Andrés Silva (1.000.000 sueldo base, contrato indefinido, AFP Modelo, Fonasa)
      const emp1 = result.employees.find(e => e.fullName === "Andrés Silva")!;
      expect(emp1).toBeDefined();
      expect(emp1.baseSalary).toBe(1000000);
      expect(emp1.healthContribution).toBe(70000); // 7% de 1.000.000
      expect(emp1.afpContribution).toBe(105800); // 10% + 0.58% = 10.58% de 1.000.000
      expect(emp1.afcEmployee).toBe(6000); // 0.6% por contrato indefinido
      expect(emp1.afcEmployer).toBe(24000); // 2.4% por contrato indefinido
      expect(emp1.sis).toBe(18400); // 1.84%
      expect(emp1.mutual).toBe(9000); // 0.90%
      expect(emp1.totalEmployeeDeduction).toBe(181800); // 105800 + 70000 + 6000

      // Empleado 2: Carolina Méndez (800.000 sueldo base, plazo fijo, AFP Habitat, Isapre)
      const emp2 = result.employees.find(e => e.fullName === "Carolina Méndez")!;
      expect(emp2).toBeDefined();
      expect(emp2.baseSalary).toBe(800000);
      expect(emp2.healthContribution).toBe(56000); // 7% de 800.000
      expect(emp2.afpContribution).toBe(90160); // 10% + 1.27% = 11.27% de 800.000
      expect(emp2.afcEmployee).toBe(0); // 0% en plazo fijo para el empleado
      expect(emp2.afcEmployer).toBe(24000); // 3% de 800.000 = 24.000
      expect(emp2.sis).toBe(14720); // 1.84% de 800.000
      expect(emp2.mutual).toBe(7200); // 0.90% de 800.000
      expect(emp2.totalEmployeeDeduction).toBe(146160); // 90160 + 56000 + 0

      // Totales consolidados de la planilla
      expect(result.totalPayable).toBe(emp1.totalPreviredPayable + emp2.totalPreviredPayable);
    });
  });

  describe("Cálculos de F29", () => {
    it("debe calcular el PPM basado en las ventas netas", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({
          data: [
            { subtotal: 1000000 },
            { subtotal: 500000 }
          ],
          error: null
        })
      } as any;

      const ppm = await calculatePpmForPeriod(mockSupabase, "tenant-id-123", "2026-06-01", "2026-06-30", 0.002);
      expect(ppm.baseAmount).toBe(1500000);
      expect(ppm.amountToPay).toBe(3000); // 1.500.000 * 0.2%
    });
  });
});
