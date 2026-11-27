# Despliegue y migración de Render a Vercel

Para la entrega del prototipo, crear una base nueva en Neon con los datos de
demostración del repositorio. Las instrucciones de respaldo y restauración
quedan disponibles si en otro despliegue se necesitan conservar los datos de
Render.

## Publicación del prototipo

El grupo integra el código en `dev`. La versión pública se publica desde un
commit de esa rama mediante Vercel CLI. GitHub y Vercel tienen pasos de
publicación separados. [Sitio del prototipo](https://proyecto-final-tup.vercel.app/).

## Arquitectura del despliegue

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

## Entrega del prototipo con una base nueva

1. Crear un proyecto en Neon y usar su base vacía. En **Connect**, obtener la
   conexión directa para preparar el esquema y la conexión con pool para
   configurar la variable `DATABASE_URL` del backend en Vercel.
2. En PowerShell 7, desde la raíz del repositorio y con las dependencias
   instaladas, ejecutar los comandos siguientes. Pegar la conexión directa
   únicamente cuando la terminal la solicite.

   ```powershell
   $env:DATABASE_URL = Read-Host -MaskInput "Conexión directa de Neon"
   $env:DB_SSL = "true"
   npm.cmd run db:migrate -- --env production
   ```

   Si la migración terminó correctamente, cargar los datos de demostración y
   verificar el estado del esquema.

   ```powershell
   npm.cmd run db:seed:demo -- --env production
   npm.cmd run db:migrate:status -- --env production
   Remove-Item Env:DATABASE_URL
   Remove-Item Env:DB_SSL
   ```

   `db:seed:demo` carga torneos, equipos, integrantes, inscripciones y roles.
   El cargador general `db:seed` también crea cuentas de prueba con una
   contraseña conocida, por eso se reserva para entornos locales.
3. Configurar las variables indicadas en el paso 7 y validar la publicación
   con el paso 8. Confirmar que se ven los torneos y equipos de ejemplo.

Para este recorrido se puede desplegar desde la copia local autorizando
Vercel CLI, incluso si la cuenta de Vercel todavía no tiene acceso a la
integración de GitHub. La URL pública se comparte después de validar la
aplicación y su conexión con Neon.

## 1. Requisitos previos para conservar datos de Render

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

1. Sincronizá `dev` y comprobá que el directorio de trabajo esté limpio.
   Trabajá desde la raíz vinculada al proyecto del grupo.
2. Prepará una compilación de producción sin asignarle el dominio público.

   ```powershell
   git switch dev
   git pull --ff-only origin dev
   git status --short
   npx.cmd --yes vercel@latest deploy --prod --skip-domain
   ```

3. Si el commit incluye migraciones, aplicalas en Neon y verificá el estado
   del esquema antes de activar la versión. [Aplicar migraciones](#5-aplicar-migraciones-pendientes).
4. Cuando la compilación esté lista, reemplazá `URL_DEL_DESPLIEGUE` por la URL
   informada por Vercel y activala en el dominio público.

   ```powershell
   npx.cmd --yes vercel@latest promote URL_DEL_DESPLIEGUE
   ```

   [Despliegue con Vercel CLI](https://vercel.com/docs/cli/deploy) · [Promover una versión](https://vercel.com/docs/cli/promote).

5. Confirmá que `GET /api/health` responde `200` y `status: ok`. Listá torneos y
   equipos para verificar también la conexión con Neon.
6. Abrí una URL interna directamente. La API de **Mis torneos** debe responder
   `401` si se consulta sin sesión. Con una cuenta organizadora, comprobá que
   aparezcan sus torneos y que una segunda cuenta no pueda editarlos.
7. Probá **Mis equipos**, solicitudes y notificaciones con cuentas de
   demostración preparadas para el ambiente publicado. Revisá los registros del
   backend en Vercel si falla una operación.

Para repetir las consultas en Postman, usá un ambiente `Vercel` con la URL del
sitio como `baseUrl`. [Guía de Postman](../postman/README.md).

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
