import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export const registerSchema = z.object({
  fullName: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  email: z.string().email("Ingresa un correo válido."),
  rut: z.string().min(7, "Ingresa un RUT válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});
