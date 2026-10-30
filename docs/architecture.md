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
3. El controlador valida parámetros y cuerpos mediante un schema de Zod.
4. El servicio ejecuta reglas de negocio y coordina modelos o transacciones.
5. El modelo de Sequelize consulta o modifica PostgreSQL.
6. El controlador transforma el resultado en una respuesta HTTP.

Esta separación permite probar reglas y traducciones HTTP de forma
independiente. No implica por sí sola la aplicación de un patrón GoF.

## Capas del backend

| Carpeta               | Responsabilidad                                  |
| --------------------- | ------------------------------------------------ |
| `backend/config`      | Conexión y configuración de Sequelize            |
| `backend/routes`      | Métodos y rutas públicas de la API               |
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

Rutas implementadas:

| Ruta               | Pantalla                   |
| ------------------ | -------------------------- |
| `/`                | Panel interno y resumen    |
| `/tournaments`     | Listado inicial de torneos |
| `/tournaments/new` | Creación de torneos        |

Las rutas de detalle, edición, equipos, autenticación y otros módulos todavía
deben incorporarse.

## Estructura del repositorio

```text
Proyecto-final-TUP/
├── backend/
│   ├── Dockerfile
│   ├── config/
│   ├── controllers/
│   ├── migrations/
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
- `organizerId`, `captainId` y `userId` son enteros positivos, pero aún no
  referencian la tabla `users`.
- El frontend consume la API mediante `VITE_API_URL` y utiliza
  `http://localhost:3000` como valor local predeterminado.
- Docker Compose espera que PostgreSQL esté saludable, ejecuta las migraciones
  en un contenedor de una sola ejecución y solo después habilita la API y el
  frontend servido por Nginx.
- Los módulos de partidas, resultados y clasificaciones no existen todavía.

## Decisiones relacionadas

- [Patrones de diseño](design-patterns.md)
- [Análisis y decisiones del bloque](decisiones-diseno.md)
- [Modelo de datos y migraciones](database.md)
- [Contrato de la API](api.md)
