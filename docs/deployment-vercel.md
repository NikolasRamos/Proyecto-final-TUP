# Despliegue y migración de Render a Vercel

Esta guía describe el procedimiento seguro para publicar el prototipo en
Vercel y trasladar PostgreSQL desde Render a Neon. El objetivo es conservar
los datos, comprobar la nueva instalación y mantener Render disponible hasta
terminar la validación.

## Arquitectura objetivo

```text
Navegador
   |
   v
Vercel (un único dominio)
   |-- / y rutas de React -> frontend compilado con Vite
   `-- /api/*             -> aplicación Express serverless
                                  |
                                  v
                             PostgreSQL en Neon
```

El frontend usa rutas relativas en producción. Por eso no necesita conocer
una URL diferente para la API y las vistas previas de Vercel consultan su
propio backend automáticamente.

## Preparación incluida en el repositorio

- `api/index.js` exporta Express como una función de Vercel.
- `vercel.json` compila React, dirige `/api/*` a Express y conserva las rutas
  de React Router al recargar el navegador.
- `backend/server.js` continúa siendo el inicio local, pero solamente verifica
  la conexión. El esquema se administra exclusivamente con migraciones.
- Sequelize admite tanto las variables `DB_*` locales como `DATABASE_URL` en
  producción.
- Los archivos `*.dump` y `*.backup` están ignorados por Git para evitar subir
  copias de la base de datos al repositorio.

## 1. Requisitos previos

- Acceso al proyecto y a PostgreSQL en Render.
- Acceso al repositorio Git del grupo.
- Una cuenta de Vercel.
- PostgreSQL Client instalado (`pg_dump`, `pg_restore` y `psql`).
- La rama que contiene esta preparación integrada en la rama que desplegará
  Vercel.

No eliminar ni detener Render durante este procedimiento.

## 2. Crear PostgreSQL en Neon

Desde el proyecto de Vercel, abrir **Storage**, elegir **Create Database** e
instalar Neon. Conviene seleccionar una región de Estados Unidos Este porque
la función está configurada en `iad1`, cerca de la base de datos.

Guardar temporalmente, fuera del repositorio:

- la URL externa de PostgreSQL de Render;
- la URL de conexión de Neon, preferentemente la conexión con pool;
- la URL directa de Neon si el proveedor entrega una diferente para tareas de
  administración.

Las direcciones contienen contraseñas. No deben pegarse en documentos,
capturas, Postman, commits ni mensajes del grupo.

## 3. Respaldar Render

En PowerShell, cargar la URL externa de Render solamente en la sesión actual:

```powershell
$env:RENDER_DATABASE_URL = "postgresql://usuario:clave@host/base?sslmode=require"
pg_dump --format=custom --no-owner --no-acl --dbname=$env:RENDER_DATABASE_URL --file=render-pre-vercel.dump
```

Comprobar que el archivo existe y contiene objetos antes de seguir:

```powershell
Get-Item .\render-pre-vercel.dump
pg_restore --list .\render-pre-vercel.dump | Select-Object -First 20
```

Guardar otra copia en un lugar privado. El archivo puede contener toda la
información de usuarios y no debe enviarse al repositorio.

## 4. Restaurar en una base Neon vacía

Cargar la URL directa de Neon en la sesión actual:

```powershell
$env:NEON_DATABASE_URL = "postgresql://usuario:clave@host/base?sslmode=require"
pg_restore --no-owner --no-acl --exit-on-error --dbname=$env:NEON_DATABASE_URL .\render-pre-vercel.dump
```

Este procedimiento supone una base nueva y vacía. Si Neon ya contiene tablas,
no utilizar opciones destructivas ni `--clean` sin revisar primero su
contenido.

Comprobar las tablas restauradas:

```powershell
psql $env:NEON_DATABASE_URL -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
```

## 5. Aplicar migraciones pendientes

El proyecto puede usar la URL de Neon sin crear un `.env` de producción:

```powershell
$env:DATABASE_URL = $env:NEON_DATABASE_URL
$env:NODE_ENV = "production"
$env:DB_SSL = "true"
npm.cmd run db:migrate:status
npm.cmd run db:migrate
npm.cmd run db:migrate:status
```

El último estado debe mostrar todas las migraciones como aplicadas. Los
seeders no deben ejecutarse sobre una restauración que ya contiene los datos
de demostración.

Al terminar, limpiar las variables de la terminal:

```powershell
Remove-Item Env:RENDER_DATABASE_URL
Remove-Item Env:NEON_DATABASE_URL
Remove-Item Env:DATABASE_URL
Remove-Item Env:DB_SSL
```

## 6. Crear el proyecto en Vercel

1. En Vercel, seleccionar **Add New > Project**.
2. Importar el repositorio del grupo.
3. Elegir la rama de producción acordada por el equipo.
4. Mantener la raíz del proyecto como `.`.
5. Vercel leerá `vercel.json`; debe mostrar Vite, `npm run build` y
   `dist/frontend`.
6. No iniciar el despliegue definitivo hasta cargar las variables.

## 7. Variables de entorno de Vercel

Configurar en **Settings > Environment Variables** para Production, Preview y
Development cuando corresponda:

| Variable                     | Valor/criterio                                             |
| ---------------------------- | ---------------------------------------------------------- |
| `DATABASE_URL`               | URL con pool entregada por Neon                            |
| `NODE_ENV`                   | `production`                                               |
| `DB_SSL`                     | `true`                                                     |
| `DB_SSL_REJECT_UNAUTHORIZED` | `true`; cambiar solo si el proveedor lo exige              |
| `DB_POOL_MAX`                | `5` para el prototipo                                      |
| `JWT_SECRET`                 | secreto largo, aleatorio y exclusivo de producción         |
| `CORS_ORIGIN`                | URL pública del proyecto; no es necesaria para mismo sitio |

No agregar `VITE_API_URL` en el despliegue unificado: si está ausente, React
consulta `/api` en el mismo dominio. Tampoco son necesarios `DB_HOST`,
`DB_PORT`, `DB_NAME`, `DB_USER` o `DB_PASSWORD` cuando existe `DATABASE_URL`.

Si Vercel/Neon inyecta automáticamente varias direcciones, seleccionar para
`DATABASE_URL` la conexión con pool. Las migraciones y restauraciones se hacen
con la conexión directa desde una terminal controlada.

## 8. Desplegar y validar

Después del despliegue, realizar estas comprobaciones en orden:

1. Abrir `https://PROYECTO.vercel.app/api/health`; debe responder estado `ok`.
2. Abrir la página inicial.
3. Recargar directamente una ruta interna, por ejemplo `/tournaments`.
4. Listar y abrir el detalle de un torneo existente.
5. Crear, editar y eliminar un torneo de prueba.
6. Listar equipos, abrir un detalle y probar sus integrantes.
7. Inscribir y retirar un equipo de un torneo.
8. Descargar el reporte PDF.
9. Probar inicio de sesión y operaciones protegidas si la integración de
   autenticación está habilitada.
10. Revisar **Logs** en Vercel y comprobar que no existan errores de conexión.

La colección de Postman puede duplicarse con un ambiente `Vercel` cuya
variable `baseUrl` sea la URL del proyecto, sin barra final.

## 9. Comparar datos antes de retirar Render

Comparar al menos los conteos esenciales en ambas bases:

```sql
SELECT 'tournaments' AS tabla, COUNT(*) FROM tournaments
UNION ALL SELECT 'teams', COUNT(*) FROM teams
UNION ALL SELECT 'team_members', COUNT(*) FROM team_members
UNION ALL SELECT 'tournament_registrations', COUNT(*) FROM tournament_registrations;
```

También debe verificarse manualmente una muestra de torneos, equipos,
integrantes e inscripciones. Mantener Render activo durante la revisión del
nuevo despliegue.

## 10. Corte y recuperación

Cuando todas las pruebas sean correctas:

1. comunicar al equipo la nueva URL;
2. actualizar Postman y el documento de entrega;
3. conservar el respaldo privado;
4. detener Render solamente después de la aceptación del grupo.

Si Vercel presenta un problema, no se perdió el servicio anterior: se vuelve a
compartir temporalmente la URL de Render mientras se corrige el despliegue.
La base de Render no debe recibir escrituras nuevas después del corte para
evitar que ambas bases diverjan.
