import cors from "cors";
import express from "express";
import helmet from "helmet";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  }),
);
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "gestion-torneos-api",
  });
});

app.use((_request, response) => {
  response.status(404).json({ message: "Recurso no encontrado" });
});

export default app;
