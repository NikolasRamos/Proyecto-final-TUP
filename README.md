# Sistema de Gestión de Torneos

Sistema web para la **creación, administración y seguimiento de torneos**, permitiendo gestionar participantes, equipos, partidas, resultados y tablas de posiciones desde una única plataforma.

---

## Integrantes

- **Nikolás Ramos**
- **Giuliano Tedeschi Gómez**
- **Ramiro Olea**

---

## Objetivo del proyecto

El objetivo es desarrollar una aplicación web que permita organizar torneos de diferentes tipos de manera sencilla y centralizada.

Los organizadores podrán crear y administrar torneos, registrar equipos y participantes, generar enfrentamientos, cargar resultados y consultar automáticamente las posiciones.

Los participantes podrán inscribirse en torneos, consultar sus partidas, resultados y posición dentro de la competición.

---

## Tecnologías utilizadas

### Frontend

- **React** — Construcción de interfaces mediante componentes.
- **React Router** — Navegación entre las pantallas de la aplicación.
- **TypeScript** — Tipado y lógica del cliente.
- **Vite** — Servidor de desarrollo y compilación del frontend.
- **CSS3** — Diseño y estilos de la aplicación.

### Backend

- **Node.js** — Entorno de ejecución.
- **Express.js** — Framework para el desarrollo de la API REST.

### Base de datos

- **PostgreSQL** — Sistema gestor de base de datos.
- **Sequelize** — ORM para la comunicación entre Node.js y PostgreSQL.
- **pgAdmin** — Administración y visualización de la base de datos.

### Herramientas

- **Git** — Control de versiones.
- **GitHub** — Repositorio y trabajo colaborativo.
- **Docker** — Contenerización del proyecto.
- **Postman** — Pruebas de la API.

---

## Requisitos del entorno

Para trabajar con el proyecto se necesita:

- **Node.js 24.x LTS** (el equipo utiliza `24.21.0`).
- **npm 11 o superior**, incluido con Node.js.
- **Docker Desktop** con Docker Compose para ejecutar PostgreSQL.
- **Git** para clonar y versionar el repositorio.

La versión esperada de Node también está declarada en `package.json` y `.nvmrc`.

### Servicios y configuración

El proyecto utiliza los siguientes servicios locales:

| Servicio      | Puerto predeterminado | Uso                   |
| ------------- | --------------------- | --------------------- |
| Frontend Vite | `5173`                | Interfaz web          |
| API Express   | `3000`                | API REST              |
| PostgreSQL    | `5432`                | Persistencia de datos |

La configuración se carga desde un archivo `.env`. El repositorio incluye
`.env.example` únicamente con valores de ejemplo; el archivo `.env` real está
excluido por `.gitignore` y no debe versionarse.

Variables disponibles:

| Variable                            | Descripción                                       |
| ----------------------------------- | ------------------------------------------------- |
| `PORT`                              | Puerto de la API                                  |
| `NODE_ENV`                          | Entorno de ejecución                              |
| `CORS_ORIGIN`                       | Origen autorizado para el frontend                |
| `DB_HOST`, `DB_PORT`                | Host y puerto de PostgreSQL                       |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Credenciales locales de PostgreSQL                |
| `JWT_SECRET`                        | Secreto local para firmar tokens de autenticación |

---

## Cómo comenzar

1. Clonar el repositorio y entrar en su carpeta:

   ```bash
   git clone https://github.com/NikolasRamos/Proyecto-final-TUP.git
   cd Proyecto-final-TUP
   ```

2. Instalar las dependencias declaradas en el lockfile:

   ```bash
   npm install
   ```

3. Crear la configuración local a partir del ejemplo:

   En PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   En Linux o macOS:

   ```bash
   cp .env.example .env
   ```

   Luego se deben reemplazar `DB_PASSWORD` y `JWT_SECRET` dentro de `.env` por
   valores locales seguros.

4. Levantar PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

5. Ejecutar las migraciones disponibles:

   ```bash
   npm run db:migrate
   ```

6. Iniciar el frontend y la API:

   ```bash
   npm run dev
   ```

El frontend quedará disponible en `http://localhost:5173` y la API en
`http://localhost:3000`. El endpoint `GET /api/health` permite comprobar que la
API está funcionando.

### Comandos útiles

| Comando              | Acción                                       |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Inicia frontend y backend en modo desarrollo |
| `npm run build`      | Comprueba TypeScript y compila el frontend   |
| `npm start`          | Inicia solamente la API                      |
| `npm test`           | Ejecuta las pruebas automatizadas            |
| `npm run lint`       | Revisa la calidad estática del código        |
| `npm run db:migrate` | Ejecuta las migraciones de Sequelize         |
| `npm run db:seed`    | Ejecuta los datos iniciales de Sequelize     |

### Convención para las migraciones

Las migraciones de la base de datos se guardan en `backend/migrations` y sus
nombres siguen esta estructura:

```text
AAAAMMDDHHmmss-accion-recurso.cjs
```

Por ejemplo, `20261011000100-create-tournaments.cjs` se interpreta así:

- `20261011000100`: marca temporal (`2026-10-11 00:01:00`) que Sequelize usa
  para ordenar las migraciones.
- `create-tournaments`: descripción breve de la modificación; en este caso,
  crear la tabla `tournaments`.
- `.cjs`: indica que la migración usa módulos CommonJS, formato esperado por
  `sequelize-cli`, mientras el resto del proyecto utiliza módulos ES.

El texto descriptivo no es un título obligatorio ni afecta el nombre de la
tabla. Se utiliza para que el equipo pueda reconocer la finalidad del archivo
sin abrirlo. La marca temporal sí debe ser única y anterior a las migraciones
que dependan de esta.

Cuando se ejecuta `npm run db:migrate`, Sequelize guarda el nombre completo del
archivo en la tabla interna `SequelizeMeta`. Por ese motivo, una migración que
ya fue aplicada no debe renombrarse, eliminarse ni reescribirse para introducir
un nuevo cambio: Sequelize podría interpretarla como una migración distinta o
la base de datos podría quedar desincronizada. Las modificaciones posteriores
se deben realizar mediante una migración nueva, con otra marca temporal y un
nombre descriptivo.

Cada archivo contiene dos operaciones:

- `up`: aplica el cambio en la base de datos.
- `down`: revierte ese cambio cuando se deshace la migración.

La migración `create-tournaments` crea la estructura inicial de los torneos y
su campo `organizer_id`. La clave foránea hacia `users.id` se agregará mediante
otra migración cuando la tabla `users` esté disponible, evitando que el orden
de trabajo de los distintos integrantes bloquee la creación de la tabla.

### Dependencias

Las dependencias necesarias durante la ejecución están declaradas en
`dependencies` dentro de `package.json`. Las herramientas de compilación,
desarrollo, migraciones, formato y pruebas están separadas en `devDependencies`.
El archivo `package-lock.json` fija las versiones resueltas para que todo el
equipo instale el mismo árbol de paquetes.

---

## Arquitectura

El sistema seguirá una arquitectura basada en una aplicación web cliente-servidor:

Las decisiones sobre patrones de diseño, incluidas las alternativas evaluadas y
sus costos, se mantienen en
[`docs/design-patterns.md`](docs/design-patterns.md).

```
┌──────────────────────────────┐
│           FRONTEND           │
│    React + TypeScript        │
└──────────────┬───────────────┘
               │
               │ HTTP / JSON
               ▼
┌──────────────────────────────┐
│           BACKEND            │
│       Node.js + Express      │
│                              │
│  Usuarios                    │
│  Torneos                     │
│  Equipos                     │
│  Partidas                    │
│  Resultados                  │
│  Clasificaciones             │
└──────────────┬───────────────┘
               │
               │ Sequelize
               ▼
┌──────────────────────────────┐
│         PostgreSQL           │
└──────────────────────────────┘
```

---

## Roles de usuario

El sistema contará inicialmente con diferentes roles:

### Administrador

Podrá:

- Gestionar usuarios.
- Gestionar torneos.
- Administrar categorías.
- Consultar estadísticas.
- Gestionar equipos y participantes.

### Organizador

Podrá:

- Crear torneos.
- Configurar las reglas del torneo.
- Registrar equipos.
- Generar enfrentamientos.
- Cargar resultados.
- Consultar tablas de posiciones.

### Participante

Podrá:

- Crear su perfil.
- Registrarse en torneos.
- Consultar sus equipos.
- Ver próximas partidas.
- Consultar resultados.
- Ver su posición en el torneo.

---

## Funcionalidades principales

### Gestión de usuarios

- Registro de usuarios.
- Inicio de sesión.
- Gestión de perfiles.
- Roles y permisos.

### Gestión de torneos

- Crear torneos.
- Editar torneos.
- Eliminar torneos.
- Consultar torneos disponibles.
- Configurar cantidad de participantes.
- Definir fechas.
- Definir modalidad.
- Estados del torneo.

### Gestión de equipos

- Crear equipos.
- Registrar jugadores.
- Agregar y eliminar integrantes.
- Inscribir equipos en torneos.
- Consultar información de los equipos.

### Gestión de partidas

- Generación de enfrentamientos.
- Consulta de próximas partidas.
- Registro de resultados.
- Actualización automática de posiciones.
- Historial de partidas.

### Clasificación

El sistema permitirá calcular automáticamente información como:

- Victorias.
- Derrotas.
- Empates.
- Puntos.
- Partidas jugadas.
- Diferencia de puntos.
- Posición en la tabla.

### Estadísticas

El sistema podrá mostrar información como:

- Torneos activos.
- Cantidad de participantes.
- Partidas disputadas.
- Equipos registrados.
- Resultados.
- Estadísticas de jugadores y equipos.

---

## API REST

El backend expondrá una API REST para la comunicación entre el frontend y el servidor.

Ejemplos de endpoints:

```
GET    /api/tournaments
GET    /api/tournaments/:id
POST   /api/tournaments
PUT    /api/tournaments/:id
PATCH  /api/tournaments/:id/status
DELETE /api/tournaments/:id

GET    /api/teams
GET    /api/teams/:id
POST   /api/teams
PUT    /api/teams/:id
DELETE /api/teams/:id
GET    /api/teams/:teamId/members
POST   /api/teams/:teamId/members
DELETE /api/teams/:teamId/members/:userId

GET    /api/tournaments/:tournamentId/registrations
POST   /api/tournaments/:tournamentId/registrations
DELETE /api/tournaments/:tournamentId/registrations/:teamId

GET    /api/partidas
GET    /api/partidas/:id
POST   /api/partidas/:id/resultado

POST   /api/auth/register
POST   /api/auth/login
```

Los endpoints podrán ampliarse a medida que avance el proyecto.

### Listado de torneos

`GET /api/tournaments` devuelve los torneos ordenados desde el más reciente y
acepta los siguientes parámetros opcionales:

| Parámetro  | Valores                                                  | Predeterminado |
| ---------- | -------------------------------------------------------- | -------------- |
| `status`   | `draft`, `open`, `in_progress`, `finished` o `cancelled` | Todos          |
| `modality` | `league`, `single_elimination` o `group_stage`           | Todas          |
| `page`     | Número entero mayor o igual a `1`                        | `1`            |
| `limit`    | Número entero entre `1` y `100`                          | `10`           |

Ejemplo:

```http
GET /api/tournaments?status=open&modality=league&page=2&limit=5
```

La respuesta incluye los registros encontrados y los datos necesarios para
navegar entre páginas:

```json
{
  "data": [],
  "pagination": {
    "page": 2,
    "limit": 5,
    "total": 0,
    "totalPages": 0
  }
}
```

### Gestión de torneos

#### Crear un torneo

`POST /api/tournaments` crea un torneo en estado `draft`. El identificador del
torneo es un UUID v4 generado automáticamente, por lo que no se envía en el
cuerpo de la petición.

```json
{
  "name": "Torneo de apertura",
  "description": "Competencia inicial de la temporada",
  "modality": "league",
  "maxParticipants": 16,
  "registrationDeadline": "2026-11-01",
  "startDate": "2026-11-05",
  "endDate": "2026-12-10",
  "organizerId": "7c02bd53-08d3-4f3d-8a74-6bd1b567a912"
}
```

Las fechas utilizan el formato `AAAA-MM-DD`. La inscripción no puede cerrar
después del inicio y la finalización no puede ser anterior al inicio. Hasta que
se integre la autenticación, `organizerId` debe enviarse como un UUID v4.

#### Consultar y editar

- `GET /api/tournaments/:id` devuelve un torneo mediante su UUID.
- `PUT /api/tournaments/:id` reemplaza todos sus datos editables.

La edición requiere `name`, `modality`, `maxParticipants`,
`registrationDeadline`, `startDate` y `endDate`. `description` es opcional. El
identificador, el organizador y el estado no se modifican mediante `PUT`.

#### Estados

`PATCH /api/tournaments/:id/status` recibe el nuevo estado:

```json
{
  "status": "open"
}
```

Las transiciones permitidas son:

| Estado actual | Estados siguientes permitidos |
| ------------- | ----------------------------- |
| `draft`       | `open`, `cancelled`           |
| `open`        | `in_progress`, `cancelled`    |
| `in_progress` | `finished`, `cancelled`       |
| `finished`    | Ninguno                       |
| `cancelled`   | Ninguno                       |

Enviar nuevamente el estado actual es una operación válida que no reescribe el
registro. Una transición no permitida responde con `409 Conflict`.

#### Eliminación

`DELETE /api/tournaments/:id` elimina físicamente un torneo únicamente cuando
se encuentra en estado `draft`. Los torneos abiertos, iniciados, finalizados o
cancelados se conservan como historial y responden con `409 Conflict`.

#### Respuestas de error

Los endpoints de torneos utilizan las siguientes respuestas generales:

| Código | Significado                                             |
| ------ | ------------------------------------------------------- |
| `400`  | UUID, datos, filtros o estado inválidos                 |
| `404`  | El torneo solicitado no existe                          |
| `409`  | La regla de estado no permite la operación              |
| `500`  | Ocurrió un error interno sin exponer detalles sensibles |

### Gestión de equipos

#### Crear un equipo

`POST /api/teams` crea un equipo con un UUID v4 generado automáticamente. El
capitán también se registra automáticamente como el primer integrante.

```json
{
  "name": "Los Halcones",
  "description": "Equipo de la categoría principal",
  "captainId": "7c02bd53-08d3-4f3d-8a74-6bd1b567a912"
}
```

El nombre debe tener entre 3 y 120 caracteres. La descripción es opcional y
admite hasta 2000 caracteres. Mientras el módulo de usuarios no esté integrado,
`captainId` debe ser un UUID v4, pero la API todavía no comprueba que corresponda
a un usuario existente.

#### Listar y consultar equipos

`GET /api/teams` devuelve los equipos desde el más reciente. Admite `page`, con
valor predeterminado `1`, y `limit`, con valor predeterminado `10` y máximo
`100`.

```http
GET /api/teams?page=1&limit=10
```

La respuesta incluye los datos de paginación:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

`GET /api/teams/:id` devuelve un equipo mediante su UUID v4 y responde `404`
cuando no existe.

#### Editar un equipo

`PUT /api/teams/:id` modifica el nombre y la descripción. El identificador y el
capitán no pueden cambiarse mediante este endpoint.

```json
{
  "name": "Los Halcones renovados",
  "description": "Nueva descripción del equipo"
}
```

#### Eliminar un equipo

`DELETE /api/teams/:id` elimina un equipo solamente cuando nunca fue inscrito
en un torneo. Si existe una inscripción activa o retirada, la API conserva el
historial y responde `409 Conflict`:

```json
{
  "message": "No se puede eliminar un equipo con inscripciones registradas"
}
```

Al eliminar un equipo permitido, sus registros de integrantes se eliminan en
cascada. Esta operación no permite borrar indirectamente el historial de los
torneos.

#### Integrantes de un equipo

Para agregar un integrante se utiliza `POST /api/teams/:teamId/members`:

```json
{
  "userId": "a6d841d2-3f7e-4f18-8c29-1b65af5ca901"
}
```

Un mismo UUID no puede pertenecer dos veces al mismo equipo. Hasta que se
integre la tabla `users`, la API valida el formato UUID v4, pero no la existencia
del usuario.

- `GET /api/teams/:teamId/members` lista los integrantes e indica cuál es el
  capitán mediante `isCaptain`.
- `DELETE /api/teams/:teamId/members/:userId` elimina un integrante.
- El capitán no puede eliminarse de su equipo y ese intento responde
  `409 Conflict`.

### Inscripciones de equipos en torneos

#### Inscribir un equipo

`POST /api/tournaments/:tournamentId/registrations` recibe el UUID del equipo:

```json
{
  "teamId": "7a3cd275-ea6c-4c7e-a322-c6b2a132fb24"
}
```

El torneo debe existir, estar en estado `open` y tener cupo disponible. Un
equipo no puede mantener dos inscripciones activas en el mismo torneo. Si había
sido retirado, una nueva petición reactiva su inscripción y conserva el mismo
registro histórico.

#### Listar inscripciones

`GET /api/tournaments/:tournamentId/registrations` devuelve por defecto las
inscripciones activas (`registered`). Admite estos parámetros:

| Parámetro | Valores                    | Predeterminado |
| --------- | -------------------------- | -------------- |
| `status`  | `registered` o `withdrawn` | `registered`   |
| `page`    | Entero mayor o igual a `1` | `1`            |
| `limit`   | Entero entre `1` y `100`   | `10`           |

```http
GET /api/tournaments/ID_DEL_TORNEO/registrations?status=registered&page=1&limit=10
```

Cada resultado incluye el estado, las fechas de la inscripción y los datos
básicos del equipo. La respuesta también contiene `page`, `limit`, `total` y
`totalPages`.

#### Retirar un equipo

`DELETE /api/tournaments/:tournamentId/registrations/:teamId` cambia la
inscripción a `withdrawn` sin borrar el registro. El retiro solo es posible
mientras el torneo se encuentra en estado `open`; de esta forma se preserva el
historial y se libera el cupo para otro equipo.

#### Respuestas de error de equipos e inscripciones

| Código | Significado                                                         |
| ------ | ------------------------------------------------------------------- |
| `400`  | UUID, cuerpo, filtro o paginación inválidos                         |
| `404`  | El equipo, torneo, integrante o inscripción no existe               |
| `409`  | Duplicado, falta de cupo o una regla de negocio impide la operación |
| `500`  | Ocurrió un error interno sin exponer detalles sensibles             |

### Integración pendiente con usuarios

La tabla `tournaments` ya almacena `organizer_id` como UUID, pero la clave
foránea se incorporará cuando la migración que crea `users` esté disponible. La
integración deberá realizarse mediante una migración nueva y posterior, sin
modificar ni renombrar `20261011000100-create-tournaments.cjs`.

Las tablas `teams` y `team_members` siguen la misma estrategia temporal:
`teams.captain_id` y `team_members.user_id` almacenan UUID v4, pero todavía no
poseen una clave foránea hacia `users.id`. Esto permite avanzar con el bloque de
equipos sin depender del bloque de usuarios.

El contrato esperado es:

- `users.id`: UUID v4 y clave primaria.
- `tournaments.organizer_id`: clave foránea hacia `users.id`.
- `ON UPDATE CASCADE`: propagar una actualización excepcional del UUID.
- `ON DELETE RESTRICT`: impedir borrar un usuario que todavía organiza torneos.
- `Tournament.belongsTo(User, { as: "organizer" })`.
- `User.hasMany(Tournament, { as: "organizedTournaments" })`.

Para equipos también deberán agregarse, mediante una migración posterior, las
claves foráneas `teams.captain_id -> users.id` y
`team_members.user_id -> users.id`, junto con las asociaciones de Sequelize. En
ese momento, las respuestas de integrantes podrán incorporar los datos públicos
del usuario en lugar de devolver solamente su UUID.

Cuando esté disponible la autenticación, la API deberá obtener el organizador
desde el token JWT y no desde el cuerpo enviado por el cliente. El middleware
de autenticación expondrá el usuario actual y las operaciones de creación,
edición, cambio de estado y eliminación deberán comprobar que sea el organizador
del torneo o un administrador.

---

## Docker

Docker será utilizado para facilitar la configuración y ejecución del entorno de desarrollo.

La aplicación podrá contar con diferentes contenedores para:

- Backend.
- PostgreSQL.
- Herramientas relacionadas con la base de datos.

Esto permitirá que los integrantes puedan levantar el proyecto utilizando una configuración común.

---

## Pruebas

Se utilizará **Postman** para realizar pruebas sobre la API REST.

Se comprobarán:

- Respuestas HTTP.
- Creación de recursos.
- Actualización de recursos.
- Eliminación de recursos.
- Validaciones.
- Autenticación.
- Manejo de errores.
- Relaciones entre entidades.

---

## Estructura aproximada del proyecto

```
gestion-torneos/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   ├── services/
│   ├── migrations/
│   ├── seeders/
│   └── app.js
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.test.tsx
│   │   ├── main.tsx
│   │   └── styles.css
│   ├── test/
│   │   └── setup.ts
│   ├── index.html
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── .env.example
├── docker-compose.yml
├── eslint.config.js
├── package.json
├── package-lock.json
├── vitest.config.ts
└── README.md
```

La estructura podrá cambiar a medida que evolucione el proyecto.

---

## Objetivo final

Al finalizar el desarrollo se espera contar con una aplicación web funcional que permita:

1. Registrar e iniciar sesión como usuario.
2. Crear y administrar torneos.
3. Registrar equipos y participantes.
4. Inscribir equipos en torneos.
5. Generar enfrentamientos.
6. Registrar resultados.
7. Actualizar automáticamente las tablas de posiciones.
8. Consultar el historial de partidas.
9. Visualizar estadísticas.
10. Administrar el sistema mediante diferentes roles.

---

## Estado del proyecto

**En desarrollo**

El proyecto se encuentra en etapa inicial. Las funcionalidades serán incorporadas progresivamente durante el período de desarrollo.
