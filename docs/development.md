# Desarrollo local

Esta guía reúne la configuración y los procedimientos cotidianos. El inicio
rápido se mantiene en el README para que una persona pueda levantar el proyecto
sin leer toda la documentación.

## Requisitos

- Node.js `24.x`; la versión utilizada está en `.nvmrc`.
- npm `11` o superior.
- Docker Desktop o Docker Engine con Compose.
- Git.

## Instalación reproducible

Para respetar las versiones resueltas en `package-lock.json`:

```bash
npm ci
```

`package.json` declara dependencias, comandos y versiones compatibles.
`package-lock.json` fija el árbol exacto instalado por el equipo.

## Variables del backend

Crear `.env` en la raíz a partir de `.env.example`.

| Variable        | Uso                                             | Ejemplo local           |
| --------------- | ----------------------------------------------- | ----------------------- |
| `PORT`          | Puerto publicado de la API                      | `3000`                  |
| `FRONTEND_PORT` | Puerto publicado del frontend                   | `5173`                  |
| `NODE_ENV`      | Entorno de ejecución                            | `development`           |
| `CORS_ORIGIN`   | Origen autorizado por CORS                      | `http://localhost:5173` |
| `DATABASE_URL`  | URL completa para PostgreSQL administrado       | Vacía en local          |
| `DB_HOST`       | Host de PostgreSQL                              | `localhost`             |
| `DB_PORT`       | Puerto de PostgreSQL                            | `5432`                  |
| `DB_NAME`       | Base de datos                                   | `gestion_torneos`       |
| `DB_USER`       | Usuario local                                   | `torneos`               |
| `DB_PASSWORD`   | Contraseña local                                | Debe reemplazarse       |
| `DB_SSL`        | Habilitar SSL para una base administrada        | `false`                 |
| `DB_POOL_MAX`   | Máximo de conexiones por instancia              | `5`                     |
| `JWT_SECRET`    | Firma y validación de JWT                       | Debe reemplazarse       |
| `VITE_API_URL`  | URL pública de la API usada al construir Docker | `http://localhost:3000` |

Los valores de `DB_PASSWORD` y `JWT_SECRET` deben ser distintos en cada
entorno y no deben contener credenciales reales dentro del repositorio.

## Variables del frontend

Crear `frontend/.env` a partir de `frontend/.env.example`.

| Variable       | Uso                                    | Predeterminado          |
| -------------- | -------------------------------------- | ----------------------- |
| `VITE_API_URL` | URL base utilizada por el cliente HTTP | `http://localhost:3000` |

Las variables expuestas por Vite se incluyen en el código del navegador y no
deben contener secretos.

## Servicios locales

| Servicio                | Puerto | Inicio                          |
| ----------------------- | ------ | ------------------------------- |
| Frontend Vite           | `5173` | `npm run dev:web`               |
| Frontend Docker (Nginx) | `5173` | `npm run docker:up`             |
| API Express             | `3000` | `npm run dev:api`               |
| API Docker              | `3000` | `npm run docker:up`             |
| PostgreSQL              | `5432` | `docker compose up -d postgres` |

`npm run dev` inicia frontend y API juntos con recarga automática. PostgreSQL
se administra por separado. `npm run docker:up` construye y levanta los cuatro
servicios sin necesitar procesos Node adicionales en el equipo anfitrión.

## Docker y base de datos

Levantar el sistema completo:

```bash
npm run docker:up
```

El orden de inicio es:

```text
postgres saludable -> migrate finaliza -> api saludable -> web
```

El servicio `migrate` termina después de aplicar las migraciones. Que aparezca
como `Exited (0)` es el resultado esperado, no un error.

Para desarrollo híbrido, iniciar solamente PostgreSQL:

```bash
docker compose up -d postgres
```

Consultar su estado:

```bash
docker compose ps
```

Aplicar migraciones:

```bash
npm run db:migrate
```

Detener los contenedores conservando los datos:

```bash
docker compose down
```

No usar `docker compose down -v` como procedimiento habitual: elimina el
volumen de PostgreSQL y sus datos. Las convenciones y relaciones están
explicadas en [database.md](database.md).

Después del cambio excepcional de nombres de las migraciones `001` a `005`,
las bases locales antiguas de prueba deben reiniciarse una sola vez:

```bash
docker compose down -v
npm run docker:up
```

## Scripts disponibles

| Script                      | Propósito                                                     |
| --------------------------- | ------------------------------------------------------------- |
| `npm run dev`               | Iniciar frontend y API con recarga                            |
| `npm run dev:web`           | Iniciar Vite                                                  |
| `npm run dev:api`           | Iniciar Express con Nodemon                                   |
| `npm start`                 | Iniciar Express sin Nodemon                                   |
| `npm run typecheck`         | Validar los tipos del frontend                                |
| `npm run build`             | Validar tipos y generar `dist/frontend`                       |
| `npm run preview`           | Previsualizar la compilación del frontend                     |
| `npm test`                  | Ejecutar Vitest una vez                                       |
| `npm run test:watch`        | Ejecutar Vitest observando cambios                            |
| `npm run lint`              | Ejecutar ESLint                                               |
| `npm run format`            | Aplicar Prettier                                              |
| `npm run docker:up`         | Construir y levantar todo el sistema                          |
| `npm run docker:down`       | Detener contenedores conservando el volumen                   |
| `npm run docker:logs`       | Seguir los registros de todos los servicios                   |
| `npm run db:migrate`        | Aplicar migraciones pendientes                                |
| `npm run db:migrate:status` | Consultar las migraciones aplicadas                           |
| `npm run db:seed`           | Cargar ejemplos, roles y cuentas de prueba locales            |
| `npm run db:seed:demo`      | Cargar ejemplos y roles                                       |
| `npm run db:seed:undo`      | Revertir todos los seeders ejecutados en la base seleccionada |

## Verificación antes de integrar

Ejecutar siempre desde la raíz:

```bash
npm run lint
npm test
npm run build
```

La secuencia comprueba estilo, comportamiento, tipos del frontend y
compilación.

Vitest, Testing Library y Supertest cubren las verificaciones automatizadas.
La [colección de Postman](../postman/README.md) cubre el contrato para las
pruebas manuales de cada rol.

## Pruebas manuales del prototipo

Prepará la base local con `npm run db:migrate` y `npm run db:seed`. Las cuentas
locales de ejemplo para administrador, organizador y dos participantes se
detallan en [el seeder de cuentas de prueba](../backend/seeders/users.cjs).
Usá dos perfiles del navegador o una ventana privada para mantener sesiones
distintas.

| Prueba                                                                       | Resultado esperado                                                                                                                                                       |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Entrar como invitado y abrir los catálogos                                   | Puede consultar equipos y torneos abiertos o en curso. La web ofrece registro e inicio de sesión.                                                                        |
| Registrar una cuenta nueva y consultar la sesión                             | Aparece el rol participante. Una cuenta administradora puede asignarle el rol organizador mediante Postman.                                                              |
| Crear un equipo como participante                                            | La cuenta se vincula como capitana y el equipo aparece en **Mis equipos**.                                                                                               |
| Pedir ingreso desde otra cuenta y luego aceptar como capitán                 | El capitán ve un aviso. Tras aceptar, la otra cuenta ve el equipo en **Mis equipos** y el aviso de respuesta. Marcá el aviso como leído y verificá que cambie su estado. |
| Invitar a la misma cuenta desde un segundo equipo y rechazar desde su sesión | La cuenta invitada recibe el aviso. La solicitud queda rechazada y el segundo equipo queda fuera de sus membresías.                                                      |
| Crear un torneo como organizador y abrirlo con otra cuenta organizadora      | El creador lo ve en **Mis torneos** y puede editarlo. Si lo abre a inscripciones, la otra cuenta puede consultarlo y su edición devuelve `403`.                          |
| Inscribir y retirar un equipo en un torneo abierto y descargar el reporte    | La inscripción conserva el plantel elegido. El retiro aparece en el historial y el PDF refleja los equipos activos.                                                      |
| Vincular un capitán a un equipo de ejemplo como administrador                | El equipo aparece en **Mis equipos** de la cuenta elegida y queda habilitada para sus tareas de capitán.                                                                 |

## PowerShell

Si la política de ejecución bloquea `npm.ps1`, utilizar el ejecutable
`npm.cmd`:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Esto no modifica permanentemente la política de seguridad de PowerShell.

## Mantenimiento de esta guía

Actualizar este documento en el mismo cambio que:

- agregue o quite una variable de entorno;
- cambie una versión requerida;
- modifique un comando;
- incorpore un servicio externo;
- cambie el procedimiento de pruebas o compilación.

El procedimiento de producción y el traslado desde Render están documentados
en [deployment-vercel.md](deployment-vercel.md).
