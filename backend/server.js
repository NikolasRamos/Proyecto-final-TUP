import "dotenv/config";
import app from "./app.js";
import database from "./config/database.js";

const port = Number(process.env.PORT ?? 3000);

database.sync({ alter: true })
  .then(async () => {
    console.log("Base de datos sincronizada correctamente.");

    app.listen(port, () => {
      console.log(`API disponible en http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo conectar o sincronizar la base de datos:", error);
  });