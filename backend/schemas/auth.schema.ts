import { Buffer } from "node:buffer";

import { z } from "zod";

const emailSchema = z
  .string({ error: "El correo es obligatorio" })
  .trim()
  .toLowerCase()
  .max(254, "El correo es demasiado largo")
  .pipe(z.email("El correo no tiene un formato válido"));

const passwordSchema = z.string({ error: "La contraseña es obligatoria" });

export const registerSchema = z.strictObject({
  nombre: z
    .string({ error: "El nombre es obligatorio" })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre debe tener como máximo 100 caracteres"),
  email: emailSchema,
  password: passwordSchema
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .refine(
      (password) => Buffer.byteLength(password, "utf8") <= 72,
      "La contraseña debe ocupar como máximo 72 bytes",
    ),
});

export const loginSchema = z.strictObject({
  email: emailSchema,
  password: passwordSchema
    .min(1, "La contraseña es obligatoria")
    .max(100, "La contraseña es demasiado larga"),
});
