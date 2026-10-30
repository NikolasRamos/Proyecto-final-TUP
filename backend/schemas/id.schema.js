import { z } from "zod";

export const entityIdSchema = z.coerce
  .number({ error: "El identificador debe ser un numero" })
  .int("El identificador debe ser un numero entero")
  .positive("El identificador debe ser mayor que cero");
