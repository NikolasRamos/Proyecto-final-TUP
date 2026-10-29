# API REST

Referencia del comportamiento implementado por la API. Debe actualizarse junto
con las rutas, validaciones y respuestas del backend.

La colección importable se encuentra en
[`postman/Gestion-Torneos.postman_collection.json`](../postman/Gestion-Torneos.postman_collection.json)
y su guía de uso en [`postman/README.md`](../postman/README.md).

## Convenciones

- URL local: `http://localhost:3000`.
- Prefijo actual: `/api`.
- Solicitudes y respuestas: JSON.
- Identificadores: enteros positivos autoincrementales.
- Fechas de negocio: `AAAA-MM-DD`.
- Los listados devuelven `data` y `pagination`.
- Los errores devuelven al menos `message`; las validaciones pueden incluir
  `errors` con `field` y `message`.

Ejemplo paginado:

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

## Salud

### `GET /api/health`

Comprueba que Express responde.

```json
{
  "status": "ok",
  "service": "gestion-torneos-api"
}
```

## Torneos

### Listar

`GET /api/tournaments`

| Parámetro  | Valores                                                 | Predeterminado |
| ---------- | ------------------------------------------------------- | -------------- |
| `search`   | Texto en nombre o descripción                           | Sin búsqueda   |
| `status`   | `draft`, `open`, `in_progress`, `finished`, `cancelled` | Todos          |
| `modality` | `league`, `single_elimination`, `group_stage`           | Todas          |
| `page`     | Entero mayor o igual a 1                                | `1`            |
| `limit`    | Entero entre 1 y 100                                    | `10`           |
| `sortBy`   | `createdAt`, `name`, `startDate`                        | `createdAt`    |
| `order`    | `asc`, `desc`                                           | `desc`         |

La búsqueda no distingue mayúsculas de minúsculas. El identificador funciona como
segundo criterio de orden para mantener resultados estables entre páginas.

```http
GET /api/tournaments?search=apertura&status=open&page=1&limit=10&sortBy=name&order=asc
```

### Consultar

`GET /api/tournaments/:id`

- `200`: devuelve `{ "data": torneo }`.
- `400`: el identificador no es un entero positivo.
- `404`: el torneo no existe.

### Crear

`POST /api/tournaments`

```json
{
  "name": "Torneo de apertura",
  "description": "Competencia inicial de la temporada",
  "modality": "league",
  "maxParticipants": 16,
  "registrationDeadline": "2026-11-01",
  "startDate": "2026-11-05",
  "endDate": "2026-12-10",
  "organizerId": 1
}
```

Reglas principales:

- el nombre tiene entre 3 y 120 caracteres;
- el cupo mínimo es 2;
- el cierre de inscripción no puede ser posterior al inicio;
- la finalización no puede ser anterior al inicio;
- `organizerId` debe ser un entero positivo;
- el servidor genera el identificador y el estado inicial `draft`.

Respuesta correcta: `201 Created`.

### Actualizar datos

`PUT /api/tournaments/:id`

Requiere todos los campos editables utilizados al crear, excepto
`organizerId`. No modifica identificador, organizador ni estado.

### Actualizar estado

`PATCH /api/tournaments/:id/status`

```json
{
  "status": "open"
}
```

| Estado actual | Siguientes estados         |
| ------------- | -------------------------- |
| `draft`       | `open`, `cancelled`        |
| `open`        | `in_progress`, `cancelled` |
| `in_progress` | `finished`, `cancelled`    |
| `finished`    | Ninguno                    |
| `cancelled`   | Ninguno                    |

Enviar el mismo estado es válido y no reescribe el registro. Una transición no
permitida responde `409 Conflict`.

### Eliminar

`DELETE /api/tournaments/:id`

Solo elimina físicamente torneos `draft`. Los demás estados se conservan como
historial y responden `409 Conflict`.

## Equipos

### Listar

`GET /api/teams?page=1&limit=10`

- `page`: entero mayor o igual a 1; predeterminado `1`.
- `limit`: entero entre 1 y 100; predeterminado `10`.
- Orden actual: creación descendente.

### Consultar

`GET /api/teams/:id`

Devuelve el equipo por su identificador numérico o responde `404`.

### Crear

`POST /api/teams`

```json
{
  "name": "Los Halcones",
  "description": "Equipo de la categoría principal",
  "captainId": 1
}
```

El identificador se genera automáticamente. El capitán se registra como primer
integrante dentro de la misma transacción.

### Actualizar

`PUT /api/teams/:id`

```json
{
  "name": "Los Halcones renovados",
  "description": "Nueva descripción"
}
```

No permite cambiar el identificador ni el capitán.

### Eliminar

`DELETE /api/teams/:id`

Solo elimina equipos sin historial de inscripciones. Si existe una inscripción
activa o retirada responde `409 Conflict`.

## Integrantes de equipos

### Listar integrantes

`GET /api/teams/:teamId/members`

Cada elemento indica el identificador numérico del usuario, la fecha de ingreso y
`isCaptain`.

### Agregar integrante

`POST /api/teams/:teamId/members`

```json
{
  "userId": 2
}
```

Un usuario no puede pertenecer dos veces al mismo equipo.

### Eliminar integrante

`DELETE /api/teams/:teamId/members/:userId`

- `404`: equipo o integrante inexistente.
- `409`: se intentó eliminar al capitán.

## Inscripciones

### Listar equipos inscritos

`GET /api/tournaments/:tournamentId/registrations`

| Parámetro | Valores                   | Predeterminado |
| --------- | ------------------------- | -------------- |
| `status`  | `registered`, `withdrawn` | `registered`   |
| `page`    | Entero mayor o igual a 1  | `1`            |
| `limit`   | Entero entre 1 y 100      | `10`           |

Cada elemento incluye la inscripción y datos básicos del equipo.

### Inscribir equipo

`POST /api/tournaments/:tournamentId/registrations`

```json
{
  "teamId": 1
}
```

El torneo debe existir, estar `open` y tener cupo. El equipo debe existir y no
puede mantener dos inscripciones activas en el mismo torneo. Si estaba
`withdrawn`, la operación reactiva el registro.

### Retirar equipo

`DELETE /api/tournaments/:tournamentId/registrations/:teamId`

Cambia el estado a `withdrawn` sin borrar la fila. Solo se permite mientras el
torneo está `open`.

## Códigos de error

| Código | Uso general                                |
| ------ | ------------------------------------------ |
| `400`  | Identificador, parámetro o cuerpo inválido |
| `404`  | Recurso inexistente                        |
| `409`  | Conflicto con una regla de negocio         |
| `500`  | Error interno sin detalles sensibles       |

## Limitaciones actuales

- No existe autenticación ni autorización.
- Los identificadores de organizadores, capitanes e integrantes no comprueban todavía la
  existencia de un usuario.
- Las rutas de partidas, resultados y autenticación aún no están implementadas.
- Todavía no existe una especificación OpenAPI; este documento debe verificarse
  contra las pruebas y el comportamiento real.
