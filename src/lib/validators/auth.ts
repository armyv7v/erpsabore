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

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Ingresa un correo válido."),
});

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "Las contraseñas no coinciden.",
  });
