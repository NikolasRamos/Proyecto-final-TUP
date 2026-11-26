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

### Acceso por rol

Los invitados y participantes pueden buscar y consultar torneos con inscripción
abierta (`open`) o en curso (`in_progress`). La API aplica ese límite al
listado, al total de la paginación y a la consulta por ID. Un filtro por un
estado no visible devuelve una página vacía y un detalle no visible devuelve
`404`. Los organizadores y administradores pueden consultar todos los estados.

La gestión de torneos, la exportación de reportes y el acceso a las
inscripciones requieren `Authorization: Bearer <token>` de un organizador o
administrador. Los mismos roles habilitan la edición de equipos y la consulta
y gestión de sus integrantes. El borrado de un equipo corresponde a su capitán
o a un administrador. El listado y el detalle de equipos son públicos, y todas
las cuentas con un rol base pueden crear equipos. En las rutas protegidas, la
API devuelve `401` sin sesión válida y `403` cuando la cuenta no tiene permiso.

### Listar

`GET /api/tournaments`

| Parámetro  | Valores                                                                               | Predeterminado |
| ---------- | ------------------------------------------------------------------------------------- | -------------- |
| `search`   | Texto en nombre o descripción                                                         | Sin búsqueda   |
| `status`   | `draft`, `open`, `in_progress`, `finished`, `cancelled`                               | Todos          |
| `modality` | `league`, `single_elimination`, `groups_playoff`, `swiss`, `free_for_all`, `gauntlet` | Todas          |
| `page`     | Entero mayor o igual a 1                                                              | `1`            |
| `limit`    | Entero entre 1 y 100                                                                  | `10`           |
| `sortBy`   | `createdAt`, `name`, `startDate`                                                      | `createdAt`    |
| `order`    | `asc`, `desc`                                                                         | `desc`         |

La búsqueda no distingue mayúsculas de minúsculas. El identificador funciona como
segundo criterio de orden para mantener resultados estables entre páginas.

Formatos disponibles:

| Valor interno        | Nombre visible     |
| -------------------- | ------------------ |
| `league`             | Liga               |
| `single_elimination` | Eliminación simple |
| `groups_playoff`     | Grupos + Playoff   |
| `swiss`              | Suizo              |
| `free_for_all`       | Free-for-all       |
| `gauntlet`           | Gauntlet           |

Las restricciones particulares se incorporan mediante Strategy. Actualmente
Liga exige al menos 3 participantes. Eliminación simple admite cupos potencia
de dos desde 2 participantes (`2`, `4`, `8`, `16`, etc.) para formar una llave
completa. Grupos + Playoff configura lugares de playoff, cantidad de grupos y
máximo por grupo. Suizo requiere al menos 4 participantes y una cantidad de
rondas entre 1 y `maxParticipants - 1`. Free-for-all exige al menos 3
participantes y Gauntlet al menos 2. La generación específica de partidas de
ambos formatos todavía está pendiente.

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
  "isTeamTournament": true,
  "minTeamMembers": 2,
  "maxTeamMembers": 5,
  "registrationDeadline": "2026-11-01",
  "startDate": "2026-11-05",
  "endDate": "2026-12-10",
  "organizerId": 1
}
```

Reglas principales:

- el nombre tiene entre 3 y 120 caracteres;
- el cupo mínimo es 2;
- si el formato es `league`, el cupo mínimo es 3;
- si el formato es `single_elimination`, el cupo debe ser potencia de dos;
- si el formato es `groups_playoff`, se requieren `playoffSpots`, `groupCount`
  y `maxParticipantsPerGroup`;
- en Grupos + Playoff, `playoffSpots` debe ser potencia de dos y divisible por
  `groupCount`;
- el máximo por grupo debe superar los clasificados por grupo y
  `maxParticipants` debe ser `groupCount * maxParticipantsPerGroup`;
- si el formato es `swiss`, se requiere `swissRounds`, un entero entre 1 y la
  cantidad de rivales distintos disponibles (`maxParticipants - 1`);
- si el formato es `free_for_all`, el cupo mínimo es 3;
- si el formato es `gauntlet`, el cupo mínimo es 2;
- el cierre de inscripción no puede ser posterior al inicio;
- la finalización no puede ser anterior al inicio;
- `organizerId` debe ser un entero positivo;
- el servidor genera el identificador y el estado inicial `draft`.

Respuesta correcta: `201 Created`.

Ejemplo de configuración de Grupos + Playoff:

```json
{
  "modality": "groups_playoff",
  "maxParticipants": 20,
  "playoffSpots": 8,
  "groupCount": 4,
  "maxParticipantsPerGroup": 5
}
```

En este caso clasifican 2 participantes por grupo. La API no decide todavía
cómo se distribuyen las inscripciones ni aplica criterios de desempate.

Ejemplo de configuración del sistema Suizo:

```json
{
  "modality": "swiss",
  "maxParticipants": 16,
  "swissRounds": 5
}
```

La interfaz recomienda `ceil(log2(maxParticipants))` rondas, pero el coordinador
puede elegir otra cantidad válida. Los emparejamientos, descansos para cantidades
impares, desempates y control de rivales repetidos pertenecen al futuro módulo
de partidas.

La misma configuración puede modificarse mediante `PUT` mientras el torneo esté
en `draft`. Una vez abiertas las inscripciones, cambiar formato, cupo, grupos o
lugares del playoff responde con conflicto. Los torneos anteriores que aún
tengan los tres campos en `null` pueden seguir actualizando datos no
estructurales. Las rondas Suizas pueden ajustarse en `draft` y `open`; quedan
bloqueadas desde `in_progress` para no invalidar partidas generadas.

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

### Descargar reporte

`GET /api/tournaments/:id/report`

Genera un PDF con los datos generales, fechas, estado, modalidad, ocupación y
todos los equipos actualmente inscritos. La respuesta utiliza
`Content-Type: application/pdf` y propone un nombre de archivo con el ID del
torneo y la fecha de generación.

- `404`: torneo inexistente.
- `500`: no se pudo reunir la información o generar el documento.

## Equipos

### Listar

`GET /api/teams?search=halcones&page=1&limit=10`

- `search`: texto opcional en nombre o descripción.
- `page`: entero mayor o igual a 1; predeterminado `1`.
- `limit`: entero entre 1 y 100; predeterminado `10`.
- Orden actual: creación descendente.

### Consultar

`GET /api/teams/:id`

Devuelve el equipo por su identificador numérico o responde `404`.

### Crear

`POST /api/teams`

Con el token de participante:

```json
{
  "name": "Los Halcones",
  "description": "Equipo de la categoría principal"
}
```

La API toma el capitán de la sesión. Si el participante incluye `captainId`, la
petición devuelve `400`. Con el token de un organizador o administrador, el
cuerpo incluye `captainId`:

```json
{
  "name": "Los Halcones",
  "description": "Equipo de la categoría principal",
  "captainId": 1
}
```

El identificador se genera automáticamente. El capitán debe tener una cuenta
activa. Su cuenta se vincula y se registra como primer integrante dentro de la
misma transacción. Si la cuenta indicada no está activa, se devuelve `404`.

### Actualizar

`PUT /api/teams/:id`

```json
{
  "name": "Los Halcones renovados",
  "description": "Nueva descripción"
}
```

No permite cambiar el identificador ni el capitán.

### Asignar capitán

`PATCH /api/teams/:id/captain` requiere un token de administrador. Recibe
`{"captainId": 7}` con el ID de una cuenta activa. Si la asignación se completa,
devuelve `200` con los datos del equipo y garantiza que la cuenta figure como
integrante. Repetir la asignación conserva una sola membresía.

La migración `014` agrega `captainAccountId` a las respuestas de equipos. El
campo queda inicialmente vacío para los equipos preexistentes. El administrador
puede vincularlos desde el detalle del equipo. La API usa el vínculo para
comprobar el permiso de borrado del capitán.

### Eliminar

`DELETE /api/teams/:id`

Requiere una sesión del capitán del equipo o de un administrador. La API
comprueba el capitán registrado mediante el ID de la sesión. Un usuario
autenticado sin ese permiso recibe `403`. Si el equipo tiene alguna inscripción
activa o retirada, la API responde `409 Conflict`.

## Integrantes de equipos

### Solicitudes, invitaciones y Mis equipos

Estas rutas usan el token de la cuenta que realiza la acción.

| Método y ruta | Uso |
| --- | --- |
| `GET /api/teams/mine` | Lista los equipos de la cuenta por membresía vinculada, con `page` y `limit`. |
| `GET /api/teams/:teamId/membership` | Indica si la cuenta ya integra el equipo, tiene un trámite pendiente o puede pedir ingreso. |
| `POST /api/teams/:teamId/join-requests` | Crea la solicitud de la cuenta participante al capitán del equipo. |
| `POST /api/teams/:teamId/invitations` | El capitán invita a una cuenta activa mediante `{ "email": "participante@example.test" }`. |
| `GET /api/teams/membership-requests` | Lista trámites de la cuenta con `box=received` o `box=sent`, `page` y `limit`. |
| `PATCH /api/teams/:teamId/membership-requests/:requestId` | El destinatario envía `{ "status": "accepted" }` o `{ "status": "rejected" }`. |

Aceptar vincula la membresía a una cuenta activa en la misma transacción. Puede
haber un solo trámite pendiente entre un equipo y una cuenta. Un `403` indica
falta de permiso y un `409` indica duplicación o un trámite ya respondido.
Repetir la misma respuesta devuelve el resultado original. Las invitaciones ya
emitidas pertenecen al equipo y pueden responderse aunque cambie su capitán.

La migración `015` vincula las membresías previas respaldadas por una asignación
de capitán. Las demás membresías numéricas se vinculan al aceptar una solicitud
o invitación. En **Mis equipos** se consultan membresías vinculadas vigentes.

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

Cada elemento incluye la inscripción, los datos básicos del equipo y
`memberIds`, con los usuarios elegidos para representar al equipo.

### Inscribir equipo

`POST /api/tournaments/:tournamentId/registrations`

```json
{
  "teamId": 1,
  "memberIds": [1, 2]
}
```

El torneo debe existir, estar `open` y tener cupo. El equipo debe existir y no
puede mantener dos inscripciones activas en el mismo torneo. Si estaba
`withdrawn`, la operación reactiva el registro y reemplaza su plantel anterior.
Todos los valores de `memberIds` deben pertenecer al equipo y la cantidad
seleccionada debe respetar `minTeamMembers` y `maxTeamMembers` del torneo.

### Retirar equipo

`DELETE /api/tournaments/:tournamentId/registrations/:teamId`

Cambia el estado a `withdrawn` sin borrar la fila. Solo se permite mientras el
torneo está `open`.

## Autenticación

- `POST /api/auth/register` recibe `nombre`, `email` y `password`. Devuelve
  `201` con los datos de la cuenta. El servidor asigna el rol `participante`.
  Un correo ya registrado devuelve `409`.
- `POST /api/auth/login` recibe `email` y `password`. Devuelve `200` con un
  JWT y los datos de la cuenta si las credenciales son correctas.
- `GET /api/auth/me` recibe `Authorization: Bearer <token>` y devuelve la cuenta
  autenticada con `idUsuario`, `nombre`, `email`, `idRol` y `role`. El nombre del
  rol se lee de la base y refleja las asignaciones posteriores al login. Si la
  sesión falta o ya no es válida, devuelve `401`.
- Ambos endpoints normalizan el correo y excluyen la contraseña de la respuesta.
  Para emitir tokens, el servidor necesita configurar `JWT_SECRET`.

### Asignar un rol a una cuenta nueva

`PATCH /api/users/:id/role`

Enviar `Authorization: Bearer <token>` de un administrador y un cuerpo JSON
como `{"role":"organizador"}`. También se admite `administrador`. El servidor
consulta el rol actual de quien realiza la operación en la base.

La cuenta de destino debe tener el rol `participante`. El endpoint devuelve
`200` con su identificador y nuevo rol. Repetir la misma asignación devuelve
`200`. Si la cuenta ya tiene otro rol elevado o cambió durante la solicitud,
devuelve `409`. La edición general de perfil queda separada de esta operación.

Las rutas de usuarios y las operaciones que modifican roles requieren una
sesión de administrador. Los tres roles base se conservan como parte de la
configuración del sistema.

#### Primera cuenta administradora

Después de desplegar esta versión, registrar una cuenta del grupo y habilitarla
desde una consola con acceso autorizado a PostgreSQL. Reemplazar el correo de
ejemplo por el de la cuenta registrada, en minúsculas.

```sql
UPDATE usuario AS cuenta
SET "idRol" = rol_admin."idRol", "updatedAt" = NOW()
FROM rol AS rol_admin
WHERE cuenta.email = 'cuenta-del-grupo@example.test'
  AND cuenta."deletedAt" IS NULL
  AND rol_admin.nombre = 'administrador'
  AND NOT EXISTS (
    SELECT 1 FROM usuario AS admin
    WHERE admin."idRol" = rol_admin."idRol"
      AND admin."deletedAt" IS NULL
  )
RETURNING cuenta."idUsuario";
```

La operación debe devolver una fila. A partir de ahí, usar la API de asignación
con la cuenta administradora para habilitar otras cuentas del equipo.

## Códigos de error

| Código | Uso general                                |
| ------ | ------------------------------------------ |
| `400`  | Identificador, parámetro o cuerpo inválido |
| `401`  | Credenciales incorrectas o sesión inválida |
| `403`  | Permisos insuficientes                      |
| `404`  | Recurso inexistente                        |
| `409`  | Conflicto con una regla de negocio         |
| `500`  | Error interno sin detalles sensibles       |

## Limitaciones actuales

- La edición por propiedad de un equipo y las solicitudes de ingreso están
  pendientes. La creación de un equipo por un participante usa su cuenta activa
  como capitán.
- La validación de los identificadores de organizador e integrante indicados
  manualmente sigue pendiente.
- Las rutas de partidas y resultados aún no están implementadas.
- Todavía no existe una especificación OpenAPI; este documento debe verificarse
  contra las pruebas y el comportamiento real.
