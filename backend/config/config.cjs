require("dotenv").config();

const databaseUrl = process.env.DATABASE_URL?.trim();
const sslEnabled =
  process.env.DB_SSL === "true" ||
  (Boolean(databaseUrl) && process.env.NODE_ENV === "production");

const sharedConfig = {
  dialect: "postgres",
  seederStorage: "sequelize",
  seederStorageTableName: "SequelizeData",
  ...(databaseUrl
    ? { use_env_variable: "DATABASE_URL" }
    : {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
      }),
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

module.exports = {
  development: sharedConfig,
  test: sharedConfig,
  production: sharedConfig,
};
