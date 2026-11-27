const { development } = require("./config.cjs");

const connection = process.env.DATABASE_URL?.trim();
const url = connection ? new URL(connection) : null;
const host = url?.hostname ?? development.host ?? "localhost";
const localHosts = ["localhost", "127.0.0.1", "::1", "[::1]"];

if (
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL ||
  !localHosts.includes(host) ||
  (url &&
    (!["postgres:", "postgresql:"].includes(url.protocol) ||
      [...url.searchParams.keys()].some((key) =>
        ["host", "hostaddr", "service"].includes(key.toLowerCase()),
      )))
) {
  throw new Error(
    "Los datos de demostración local requieren PostgreSQL local en un entorno de desarrollo",
  );
}

module.exports = {
  development: {
    ...development,
    host,
    seederStorageTableName: "SequelizeDataLocalDemo",
  },
};
