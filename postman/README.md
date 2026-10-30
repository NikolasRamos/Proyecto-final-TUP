# Colección de Postman

Esta carpeta contiene una copia versionada y entregable de las peticiones de la
API. No contiene contraseñas, tokens ni otros secretos.

## Archivos

- `Gestion-Torneos.postman_collection.json`: colección con los 18 endpoints.
- `Local.postman_environment.json`: ambiente local con la URL de la API.
- `../docs/api.md`: referencia escrita de parámetros, reglas y respuestas.

## Importar en Postman

1. Abrir Postman y seleccionar **Import**.
2. Seleccionar los dos archivos JSON de esta carpeta.
3. Elegir el ambiente **Local - Gestión de torneos**.
4. Abrir la colección **Gestión de torneos - API**.
5. Ejecutar primero `01 - Salud > Comprobar API`.

Si la API está iniciada, la comprobación debe responder `200 OK`.

## Variables utilizadas

| Variable       | Uso                                                    |
| -------------- | ------------------------------------------------------ |
| `baseUrl`      | Dirección de la API local                              |
| `tournamentId` | Torneo utilizado en consultas, cambios e inscripciones |
| `teamId`       | Equipo utilizado en consultas y operaciones            |
| `organizerId`  | Usuario organizador al crear un torneo                 |
| `captainId`    | Usuario capitán al crear un equipo                     |
| `userId`       | Usuario utilizado para agregar o retirar integrantes   |

Las peticiones **Crear torneo** y **Crear equipo** guardan automáticamente los
identificadores devueltos por la API en `tournamentId` y `teamId`. Los demás
identificadores se pueden cambiar desde la pestaña **Variables** de la
colección.

## Orden recomendado para una demostración

1. Comprobar la API.
2. Crear un torneo.
3. Consultar el torneo creado.
4. Crear un equipo.
5. Consultar el equipo y sus integrantes.
6. Agregar otro integrante.
7. Cambiar el torneo de `draft` a `open`.
8. Inscribir el equipo en el torneo.
9. Listar los equipos inscritos.

No conviene ejecutar toda la colección como si fuera una única prueba: algunas
operaciones son alternativas entre sí. Por ejemplo, un torneo abierto ya no se
puede eliminar físicamente y un equipo con historial de inscripciones tampoco.

## Guardar y entregar cambios

Cuando se agregue o modifique un endpoint:

1. actualizar la petición correspondiente en Postman;
2. exportar nuevamente la colección en formato **Collection v2.1**;
3. reemplazar `Gestion-Torneos.postman_collection.json`;
4. actualizar `docs/api.md` si cambió el contrato público;
5. comprobar que no se hayan exportado secretos.

Para la entrega se pueden compartir esta carpeta completa o importar la
colección en el espacio de trabajo del grupo y publicar su documentación desde
Postman.
