import "dotenv/config";

import pg from "pg";
import { Sequelize } from "sequelize";

const databaseUrl = process.env.DATABASE_URL?.trim();
const sslEnabled =
  process.env.DB_SSL === "true" ||
  (Boolean(databaseUrl) && process.env.NODE_ENV === "production");

const connectionOptions = {
  dialect: "postgres",
  dialectModule: pg,
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  pool: {
    max: Number(process.env.DB_POOL_MAX ?? 5),
    min: 0,
    acquire: 30_000,
    idle: 10_000,
  },
  ...(sslEnabled
    ? {
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized:
              process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
          },
        },
      }
    : {}),
};

const database = databaseUrl
  ? new Sequelize(databaseUrl, connectionOptions)
  : new Sequelize(
      process.env.DB_NAME ?? "gestion_torneos",
      process.env.DB_USER ?? "torneos",
      process.env.DB_PASSWORD ?? "",
      {
        ...connectionOptions,
        host: process.env.DB_HOST ?? "localhost",
        port: Number(process.env.DB_PORT ?? 5432),
      },
    );

export default database;
