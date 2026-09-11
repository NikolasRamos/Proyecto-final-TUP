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

- **HTML5** — Estructura de las páginas.
- **CSS3** — Diseño y estilos de la aplicación.
- **TypeScript** — Lógica del cliente e interacción con la API.

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

### Dependencias

Las dependencias necesarias durante la ejecución están declaradas en
`dependencies` dentro de `package.json`. Las herramientas de compilación,
desarrollo, migraciones, formato y pruebas están separadas en `devDependencies`.
El archivo `package-lock.json` fija las versiones resueltas para que todo el
equipo instale el mismo árbol de paquetes.

---

## Arquitectura

El sistema seguirá una arquitectura basada en una aplicación web cliente-servidor:

```
┌──────────────────────────────┐
│           FRONTEND           │
│       HTML / CSS / TS        │
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
GET    /api/torneos
GET    /api/torneos/:id
POST   /api/torneos
PUT    /api/torneos/:id
DELETE /api/torneos/:id

GET    /api/equipos
POST   /api/equipos
PUT    /api/equipos/:id
DELETE /api/equipos/:id

GET    /api/partidas
GET    /api/partidas/:id
POST   /api/partidas/:id/resultado

POST   /api/auth/register
POST   /api/auth/login
```

Los endpoints podrán ampliarse a medida que avance el proyecto.

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
│   ├── css/
│   ├── ts/
│   ├── pages/
│   └── index.html
│
├── docker/
│
├── .env.example
├── docker-compose.yml
├── package.json
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
