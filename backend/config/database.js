import "dotenv/config";

import { Sequelize } from "sequelize";

const database = new Sequelize(
  process.env.DB_NAME ?? "gestion_torneos",
  process.env.DB_USER ?? "torneos",
  process.env.DB_PASSWORD ?? "",
  {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
  },
);

export default database;
