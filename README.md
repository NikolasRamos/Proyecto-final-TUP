# Sistema de Gestión de Torneos

Aplicación web para crear, administrar y seguir torneos, equipos e
inscripciones desde una única plataforma. Es un proyecto académico del
**Grupo 16** de la Tecnicatura Universitaria en Programación.

## Integrantes

- **Nikolás Ramos**
- **Giuliano Tedeschi Gómez**
- **Ramiro Olea**

## Estado actual

- Torneos con seis formatos, búsqueda, filtros, paginación, detalle y gestión por organizador. [Alcance funcional](docs/product-scope.md).
- Equipos, integrantes, capitanes e inscripciones con selección de plantel y reporte PDF.
- Registro, inicio de sesión y permisos por rol. Las cuentas pueden usar **Mis equipos**, **Solicitudes** y **Notificaciones**. Organizadores y administradores también tienen **Mis torneos**.
- PostgreSQL con migraciones, datos de demostración y pruebas del backend y el frontend.

La rama de integración del grupo es `dev`. El sitio público se publica desde esa rama y usa PostgreSQL administrado en Neon. [Aplicación en Vercel](https://proyecto-final-tup.vercel.app/) · [Guía de despliegue](docs/deployment-vercel.md).

La generación de partidas, los resultados y las clasificaciones siguen en integración.

## Tecnologías principales

| Área          | Tecnologías                                     |
| ------------- | ----------------------------------------------- |
| Frontend      | React, TypeScript, React Router, Vite y CSS     |
| Backend       | Node.js, Express y Zod                          |
| Persistencia  | PostgreSQL, Sequelize y Sequelize CLI           |
| Calidad       | Vitest, Testing Library, Supertest y ESLint     |
| Entorno local | npm, Docker Compose, Git y variables de entorno |

## Requisitos

- **Node.js 24.x LTS**. El equipo utiliza `24.21.0`, declarado en `.nvmrc`.
- **npm 11 o superior**.
- **Docker Desktop** o Docker Engine con Compose.
- **Git**.

## Puesta en marcha

1. Clonar el repositorio y entrar en la carpeta:

   ```bash
   git clone https://github.com/NikolasRamos/Proyecto-final-TUP.git
   cd Proyecto-final-TUP
   git switch dev
   ```

2. Instalar exactamente las dependencias del lockfile:

   ```bash
   npm ci
   ```

3. Crear los archivos de configuración local.

   En PowerShell:

   ```powershell
   Copy-Item .env.example .env
   Copy-Item frontend/.env.example frontend/.env
   ```

   En Linux o macOS:

   ```bash
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   ```

   Reemplazar `DB_PASSWORD` y `JWT_SECRET` por valores locales. Ningún
   archivo `.env` real debe subirse al repositorio.

4. Levantar el sistema completo con Docker:

   ```bash
   npm run docker:up
   ```

   Compose inicia PostgreSQL, ejecuta las migraciones pendientes y, solamente
   si finalizan correctamente, inicia la API y el frontend.

5. Para desarrollar con recarga automática, usá esta variante de inicio.
   Levantá solo PostgreSQL en Docker y ejecutá las aplicaciones con Node.

   ```bash
   docker compose up -d postgres
   npm run db:migrate
   npm run dev
   ```

Servicios locales:

| Servicio   | Dirección                          |
| ---------- | ---------------------------------- |
| Frontend   | `http://localhost:5173`            |
| API        | `http://localhost:3000`            |
| Salud API  | `http://localhost:3000/api/health` |
| PostgreSQL | `localhost:5432`                   |

## Datos de demostración

Para probar en una **base local**, ejecutá la carga desde la raíz con PostgreSQL iniciado y las migraciones aplicadas.

```bash
npm run db:seed
```

La carga incluye seis torneos, 16 equipos, sus integrantes e inscripciones, los tres roles y cuatro cuentas de prueba locales. Los equipos y torneos de ejemplo conservan sus identificadores históricos. Un administrador puede vincular capitanes desde el detalle del equipo. [Datos de prueba y recorridos manuales](docs/development.md#pruebas-manuales-del-prototipo).

Para preparar una base nueva de Vercel se usa `db:seed:demo`, que carga los ejemplos y roles sin crear las cuentas ficticias locales. [Preparación de producción](docs/deployment-vercel.md#entrega-del-prototipo-con-una-base-nueva).

## Configuración mínima

El backend lee las variables del archivo `.env` ubicado en la raíz:

| Variable                            | Propósito                            |
| ----------------------------------- | ------------------------------------ |
| `PORT`, `FRONTEND_PORT`             | Puertos publicados por Docker        |
| `NODE_ENV`                          | Entorno de ejecución                 |
| `CORS_ORIGIN`                       | Origen autorizado para el frontend   |
| `DATABASE_URL`                      | Conexión PostgreSQL administrada     |
| `DB_HOST`, `DB_PORT`                | Dirección de PostgreSQL local        |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Base de datos y credenciales locales |
| `DB_SSL`, `DB_POOL_MAX`             | SSL y límite de conexiones           |
| `JWT_SECRET`                        | Secreto para firmar y validar JWT |
| `VITE_API_URL`                      | URL pública de la API para React     |

El frontend lee `VITE_API_URL` desde `frontend/.env`. En desarrollo utiliza
`http://localhost:3000` si la variable no está definida.

La explicación completa de los archivos de entorno, Docker y procedimientos
habituales está en [`docs/development.md`](docs/development.md).

## Comandos frecuentes

| Comando                     | Acción                                     |
| --------------------------- | ------------------------------------------ |
| `npm run dev`               | Inicia frontend y API                      |
| `npm run dev:web`           | Inicia solamente el frontend               |
| `npm run dev:api`           | Inicia solamente la API                    |
| `npm start`                 | Inicia la API sin recarga automática       |
| `npm test`                  | Ejecuta todas las pruebas una vez          |
| `npm run test:watch`        | Ejecuta las pruebas en modo interactivo    |
| `npm run lint`              | Revisa el código con ESLint                |
| `npm run typecheck`         | Comprueba los tipos del frontend           |
| `npm run build`             | Comprueba tipos y compila el frontend      |
| `npm run format`            | Formatea el repositorio con Prettier       |
| `npm run docker:up`         | Construye y levanta el sistema completo    |
| `npm run docker:down`       | Detiene los contenedores conservando datos |
| `npm run docker:logs`       | Sigue los registros de los servicios       |
| `npm run db:migrate`        | Aplica las migraciones pendientes          |
| `npm run db:migrate:status` | Muestra el estado de las migraciones       |

Antes de integrar cambios se recomienda ejecutar, en este orden:

```bash
npm run lint
npm test
npm run build
```

## Estructura principal

```text
Proyecto-final-TUP/
├── api/           Entrada serverless de Express para Vercel
├── backend/       API, reglas de negocio, persistencia y pruebas
├── frontend/      Aplicación React y pruebas de interfaz
├── shared/        Reglas de formatos usadas por el backend y el frontend
├── docs/          Documentación técnica y decisiones
├── postman/       Colección, ambiente local y guía de uso de la API
├── output/        Entregables generados
├── .dockerignore  Archivos excluidos de las imágenes
├── docker-compose.yml  Orquestación del sistema local
├── package.json   Dependencias y comandos compartidos
├── vercel.json    Compilación y rutas del despliegue público
└── README.md      Punto de entrada al proyecto
```

## Documentación

| Documento                                                                | Contenido                                                              |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| [`docs/product-scope.md`](docs/product-scope.md)                         | Objetivo, roles, alcance actual y funcionalidades planificadas         |
| [`docs/architecture.md`](docs/architecture.md)                           | Componentes, capas, flujo de una petición y estructura del repositorio |
| [`docs/api.md`](docs/api.md)                                             | Endpoints, parámetros, cuerpos, respuestas y errores                   |
| [`docs/database.md`](docs/database.md)                                   | Tablas, relaciones, Docker y convención de migraciones                 |
| [`docs/diagrama-entidad-relacion.md`](docs/diagrama-entidad-relacion.md) | Diagrama del esquema implementado y sus restricciones                  |
| [`docs/development.md`](docs/development.md)                             | Entorno, scripts, pruebas y procedimientos de trabajo                  |
| [`docs/deployment-vercel.md`](docs/deployment-vercel.md)                 | Despliegue en Vercel y migración segura de PostgreSQL                  |
| [`docs/design-patterns.md`](docs/design-patterns.md)                     | Patrones aplicados, descartados y candidatos futuros                   |
| [`docs/decisiones-diseno.md`](docs/decisiones-diseno.md)                 | Diagnóstico, alternativas, decisiones, evidencia y trade-offs          |
| [`postman/README.md`](postman/README.md)                                 | Importación, variables y recorrido recomendado de la colección         |

La documentación debe actualizarse junto con el código cuando cambien los
comandos, contratos, variables o decisiones que describe.
