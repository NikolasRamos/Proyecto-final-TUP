# Arquitectura

Este documento orienta a quienes necesitan comprender dónde se encuentra cada
responsabilidad y cómo circula una solicitud. Las decisiones con alternativas y
trade-offs se documentan por separado.

## Vista general

```text
┌──────────────────────────────┐
│ Frontend                     │
│ React + TypeScript + Vite    │
└──────────────┬───────────────┘
               │ HTTP / JSON
               ▼
┌──────────────────────────────┐
│ API                          │
│ Node.js + Express + Zod      │
│                              │
│ Rutas → controladores        │
│       → servicios → modelos  │
└──────────────┬───────────────┘
               │ Sequelize
               ▼
┌──────────────────────────────┐
│ PostgreSQL                   │
└──────────────────────────────┘
```

## Flujo de una solicitud

1. El frontend utiliza los módulos de `frontend/src/api` para enviar HTTP.
2. Express selecciona una ruta de `backend/routes`.
3. Los middlewares comprueban sesión, rol y acceso al recurso cuando corresponde.
4. El controlador valida parámetros y cuerpos mediante un schema de Zod.
5. El servicio aplica las reglas de negocio y coordina modelos o transacciones.
6. Sequelize consulta o modifica PostgreSQL.
7. El controlador envía una respuesta HTTP.

Esta separación permite probar reglas y traducciones HTTP de forma
independiente. No implica por sí sola la aplicación de un patrón GoF.

## Capas del backend

| Carpeta               | Responsabilidad                                  |
| --------------------- | ------------------------------------------------ |
| `backend/config`      | Conexión y configuración de Sequelize            |
| `backend/routes`      | Métodos y rutas de la API                         |
| `backend/middlewares` | Sesión, roles y permisos sobre los recursos       |
| `backend/controllers` | Validación de entrada y respuestas HTTP          |
| `backend/schemas`     | Contratos y validaciones con Zod                 |
| `backend/services`    | Reglas de negocio, transacciones y consultas     |
| `backend/models`      | Representación de tablas y asociaciones actuales |
| `backend/migrations`  | Evolución versionada del esquema                 |
| `backend/tests`       | Pruebas de rutas, servicios y modelos            |

## Organización del frontend

| Carpeta                   | Responsabilidad                            |
| ------------------------- | ------------------------------------------ |
| `frontend/src/pages`      | Pantallas asociadas con rutas              |
| `frontend/src/components` | Componentes visuales reutilizables         |
| `frontend/src/api`        | Cliente HTTP y operaciones por recurso     |
| `frontend/src/types`      | Contratos TypeScript de datos y respuestas |
| `frontend/test`           | Configuración compartida de pruebas        |

### Rutas del frontend

| Ruta | Pantalla | Acceso |
| --- | --- | --- |
| `/` | Panel y accesos al catálogo | Público |
| `/login`, `/register` | Inicio de sesión y registro | Público |
| `/tournaments`, `/tournaments/:id` | Listado y detalle de torneos. La gestión y las inscripciones se muestran según los permisos del torneo. | Según la visibilidad de cada torneo |
| `/tournaments/new` | Crear torneo | Organizador o administrador |
| `/my-tournaments` | Listado de torneos de la cuenta | Organizador o administrador |
| `/teams`, `/teams/:id` | Listado y detalle de equipos | Público. Las acciones requieren los permisos correspondientes. |
| `/teams/new` | Crear equipo | Participante, organizador o administrador |
| `/my-teams`, `/team-requests`, `/notifications` | Membresías, trámites y avisos de la cuenta | Sesión válida |

React comprueba la sesión para mostrar las acciones disponibles. Los
middlewares de Express verifican el rol y la propiedad del recurso al recibir
una petición. Los formularios y las Strategies utilizan
[`shared/tournament-format-rules.ts`](../shared/tournament-format-rules.ts)
para compartir los cupos y cálculos de cada formato.

## Estructura del repositorio

```text
Proyecto-final-TUP/
├── api/  Entrada de Express para Vercel
├── backend/
│   ├── Dockerfile
│   ├── config/
│   ├── controllers/
│   ├── migrations/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── schemas/
│   ├── services/
│   ├── tests/
│   ├── app.js
│   └── server.js
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   └── types/
│   ├── test/
│   └── vite.config.ts
├── shared/  Reglas de formatos de torneos
├── docs/
├── output/
├── .dockerignore
├── docker-compose.yml
├── package.json
└── README.md
```

## Límites actuales

- El backend persiste datos reales; todavía no existe un modo mock global para
  la entrega de prototipo.
- `organizerAccountId` vincula los torneos nuevos con una cuenta autenticada.
  Los torneos del prototipo conservan su identificador anterior y quedan a cargo
  de los administradores.
- El frontend consume la API mediante `VITE_API_URL` y utiliza
  `http://localhost:3000` como valor local predeterminado. En Vercel utiliza
  rutas relativas para compartir el mismo dominio con la API.
- Docker Compose espera que PostgreSQL esté saludable, ejecuta las migraciones
  en un contenedor de una sola ejecución y solo después habilita la API y el
  frontend servido por Nginx.
- Partidas, resultados y posiciones tienen esquema y modelos. Las rutas
  iniciales de partidos de Liga siguen fuera del conjunto servido por Express.

## Decisiones relacionadas

- [Patrones de diseño](design-patterns.md)
- [Análisis y decisiones del bloque](decisiones-diseno.md)
- [Modelo de datos y migraciones](database.md)
- [Contrato de la API](api.md)
- [Despliegue y migración a Vercel](deployment-vercel.md)
