import app from "../backend/app.js";

// Vercel convierte esta aplicación Express en una única función serverless.
// Las migraciones se ejecutan de forma controlada antes del despliegue; nunca
// se modifica el esquema automáticamente durante una petición.
export default app;
