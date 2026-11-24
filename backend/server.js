import "dotenv/config";
import app from "./app.js";
import database from "./config/database.js";

const port = Number(process.env.PORT ?? 3000);

database
  .authenticate()
  .then(() => {
    console.log("Conexión con la base de datos verificada.");

    app.listen(port, () => {
      console.log(`API disponible en http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo conectar con la base de datos:", error);
    process.exitCode = 1;
  });
