import { z } from "zod";

export const invoiceLineSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  description: z.string().min(3, "La descripcion debe tener al menos 3 caracteres."),
  qty: z.number().positive("La cantidad debe ser mayor que cero."),
  unitPrice: z.number().nonnegative("El precio unitario no puede ser negativo."),
});

export const createInvoiceSchema = z.object({
  customer: z.object({
    name: z.string().min(3, "El nombre del cliente es obligatorio."),
    rut: z.string().min(8, "El RUT es obligatorio."),
    email: z.string().email("El correo del cliente no es válido.").optional().nullable().or(z.literal("")),
  }),
  issueDate: z.string().min(1, "La fecha de emision es obligatoria."),
  dueDate: z.string().min(1, "La fecha de vencimiento es obligatoria."),
  currency: z.string().default("CLP"),
  notes: z.string().optional().nullable(),
  taxRate: z.number().min(0).max(1).default(0.19),
  items: z.array(invoiceLineSchema).min(1, "Debes agregar al menos una linea."),
});

export const registerPaymentSchema = z.object({
  invoiceId: z.string().uuid("La factura seleccionada no es valida."),
  amount: z.number().positive("El monto del pago debe ser mayor que cero."),
  paymentDate: z.string().min(1, "La fecha de pago es obligatoria."),
  reference: z.string().optional().nullable(),
  method: z.string().optional().nullable(),
});
