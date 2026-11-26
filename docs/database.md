# Base de datos y migraciones

El proyecto utiliza PostgreSQL 17, ejecutado localmente con Docker Compose, y
Sequelize como ORM. Este documento describe el esquema actual y cómo debe
evolucionar sin perder sincronización entre ambientes.

## Modelo actual

El [diagrama entidad-relación](diagrama-entidad-relacion.md) distingue las
claves foráneas de los vínculos que verifica la aplicación.

### `rol` y `usuario`

`rol` tiene un `idRol` y un nombre único. `usuario` guarda `idUsuario`,
nombre, correo único y el hash de la contraseña. `usuario.idRol` referencia a
`rol.idRol`. La baja lógica de una cuenta usa `deletedAt`. La API comprueba
que la cuenta siga activa y utiliza su rol vigente para autorizar operaciones.

### `tournaments`

Almacena nombre, descripción, formato en la columna `modality`, cupo, fechas,
estado y `organizer_id`. Los identificadores son enteros autoincrementales.

La migración `017-link-tournament-organizer-accounts.cjs` agrega
`organizer_account_id` y un índice para el listado Mis torneos. El servidor
guarda ahí el ID de la cuenta autenticada al crear un torneo. Los torneos
anteriores conservan `organizer_id` y quedan sin una cuenta vinculada, porque
ese identificador originalmente se ingresaba manualmente. Los administradores
pueden seguir gestionando esos torneos.

La migración `012-add-groups-playoff-configuration.cjs` agrega:

- `playoff_spots`: lugares disponibles en la fase eliminatoria;
- `group_count`: cantidad de grupos;
- `max_participants_per_group`: límite de participantes de cada grupo.

Las tres columnas son opcionales para conservar torneos anteriores. Cuando se
completan, la base exige que correspondan al formato `groups_playoff`, que los
lugares sean potencia de dos, que los grupos los dividan exactamente y que el
cupo total coincida con `group_count * max_participants_per_group`.

La migración `013-add-swiss-rounds.cjs` agrega `swiss_rounds`. La columna es
opcional para conservar torneos Suizos anteriores, pero cuando tiene un valor la
base exige que la modalidad sea `swiss`, que exista al menos una ronda y que no
supere `max_participants - 1`. Este último límite evita prometer más rondas que
rivales distintos; la lógica concreta de emparejamientos se implementará con las
partidas.

Valores actuales de `modality`:

- `league`;
- `single_elimination`;
- `groups_playoff`;
- `swiss`;
- `free_for_all`;
- `gauntlet`.

La migración `011-rename-group-stage-format.cjs` transforma el identificador
anterior `group_stage` en `groups_playoff`. Se conserva el nombre de columna
`modality` para no romper el contrato existente; en el dominio y la interfaz se
presenta como formato del torneo.

La migración `009` agrega `is_team_tournament`, `min_team_members` y
`max_team_members`. Un torneo individual conserva ambos límites vacíos. Los
torneos por equipos admiten límites opcionales para filas anteriores al cambio.

Índices principales:

- `organizer_id` y `organizer_account_id`;
- `status`.

### `teams` y `team_members`

`teams` almacena el nombre, la descripción y el `captain_id` histórico.
La migración `014` agrega `captain_account_id` para identificar la cuenta que
puede actuar como capitán. Un administrador puede vincular capitanes desde el
detalle de los equipos de demostración.

`team_members.team_id` tiene una clave foránea con borrado en cascada. La
combinación `team_id + user_id` es única. Desde la migración `015`,
`account_linked` distingue las membresías verificadas de las filas históricas.
**Mis equipos** solo devuelve membresías vinculadas a la cuenta autenticada.

### `team_membership_requests` y `team_notification_reads`

La migración `015` guarda solicitudes e invitaciones en
`team_membership_requests` con equipo, cuenta, iniciador, tipo y estado. Su
índice único parcial permite un solo trámite `pending` por equipo y cuenta.
La aceptación actualiza el trámite y vincula la membresía en una transacción.

La migración `016` guarda lecturas en `team_notification_reads`. La clave
compuesta combina `request_id`, `user_id` y `event`. Los avisos se calculan
desde los trámites visibles. La tabla registra qué cuenta leyó cada evento.

### `tournament_registrations`

Relaciona torneos y equipos con estado `registered` o `withdrawn`.

- `tournament_id` referencia `tournaments.id`.
- `team_id` referencia `teams.id`.
- Ambas claves usan `ON DELETE RESTRICT` para conservar el historial.
- La combinación `tournament_id + team_id` es única.

### `tournament_registration_members`

La migración `010` guarda el plantel elegido para una inscripción. Cada fila
referencia a `tournament_registrations.id` con borrado en cascada y el par
`registration_id + user_id` es único. Reactivar una inscripción reemplaza el
plantel anterior.

### `matches`

Almacena los partidos programados para un torneo, los equipos local y
visitante, la ronda, la fecha y su estado.

- `tournament_id` referencia `tournaments.id`.
- `home_team_id` y `away_team_id` referencian `teams.id`.
- Una restricción impide enfrentar un equipo contra sí mismo.

### `results`

Registra un único marcador por partido.

- `match_id` referencia `matches.id` y es único.
- Los marcadores local y visitante no pueden ser negativos.

### `standings`

Conserva los acumulados de cada equipo dentro de un torneo: partidos jugados,
victorias, empates, derrotas, goles, diferencia y puntos.

- `tournament_id` referencia `tournaments.id`.
- `team_id` referencia `teams.id`.
- La combinación `tournament_id + team_id` es única.

## Identificadores y cuentas de usuario

La tabla `usuario` identifica cada cuenta con `idUsuario`. Los identificadores
del prototipo (`tournaments.organizer_id`, `teams.captain_id` y
`team_members.user_id`) pueden contener datos anteriores a la autenticación.
Los permisos de propiedad de torneos y capitanía se comprueban con
`organizer_account_id` y `captain_account_id`, respectivamente.

## Identificadores simplificados del prototipo

Las entidades del bloque utilizan `INTEGER` autoincremental para facilitar las
pruebas, las URLs y la integración con `usuario.idUsuario`. El tipo se encuentra
centralizado en el schema `backend/schemas/id.schema.js` y en el tipo
`frontend/src/types/id.ts`, por lo que el resto del código trata cada ID como
un valor opaco.

La migración `005-simplify-prototype-identifiers.cjs` reconstruye las cuatro
tablas de este bloque y elimina sus datos de prueba. Esta pérdida fue aceptada
porque todavía no existe información productiva. La migración no elimina ni
modifica la tabla de usuarios.

Si más adelante se adopta UUID u otro esquema, se deberá crear una migración
nueva, mantener el contrato `id` de la API y actualizar únicamente los tipos y
validaciones centrales.

## Convención de nombres

Los archivos de `backend/migrations` siguen esta estructura:

```text
NNN-accion-recurso.cjs
```

Ejemplo:

```text
001-create-tournaments.cjs
```

- `001`: número secuencial de tres dígitos utilizado para ordenar migraciones.
- `create-tournaments`: descripción breve de la operación.
- `.cjs`: CommonJS, formato utilizado por Sequelize CLI mientras la
  aplicación usa módulos ES.

La parte descriptiva ayuda a reconocer la finalidad del archivo; no define el
nombre de la tabla. El número debe ser único, usar ceros a la izquierda y
respetar las dependencias entre cambios. La próxima migración toma el número
siguiente disponible; por ejemplo, después de `008` corresponde `009`.

Si Sequelize CLI genera automáticamente un archivo con una marca temporal, se
debe renombrar a esta convención antes de ejecutarlo o compartirlo.

## Operaciones de una migración

Cada archivo contiene:

- `up`: aplica el cambio;
- `down`: revierte el cambio.

Sequelize registra el nombre completo de cada migración aplicada en
`SequelizeMeta`. Una migración ejecutada no debe:

- renombrarse;
- eliminarse;
- reescribirse para introducir un cambio nuevo.

Las modificaciones posteriores requieren otra migración con el siguiente
número. Una migración nueva siempre parte del estado actual del esquema: no se
inserta un número menor para intentar ejecutarla antes que cambios ya aplicados.
Alterar o reordenar el historial aplicado puede desincronizar las bases de datos
del equipo.

Los archivos se renombraron a esta convención mientras la información era de
prueba. Por ese motivo, las bases locales que todavía registren los nombres
anteriores deben recrear estas tablas y su historial de migraciones antes de
ejecutar la nueva secuencia.

## Comandos

Iniciar todo el sistema y aplicar migraciones automáticamente:

```bash
npm run docker:up
```

Iniciar solamente PostgreSQL para desarrollo local con Node:

```bash
docker compose up -d postgres
```

Comprobar el contenedor:

```bash
docker compose ps
```

Aplicar migraciones:

```bash
npm run db:migrate
```

Para cargar torneos, equipos, integrantes de demostración y roles en una base
nueva, usar:

```bash
npm run db:seed:demo
```

En local, `npm run db:seed` también crea cuatro cuentas ficticias. Sequelize
registra las ejecuciones en `SequelizeData`. Los datos históricos de ejemplo
conservan sus IDs y se vinculan a cuentas mediante las operaciones descritas
arriba. Para operar sobre una base administrada, ver la
[guía de despliegue](deployment-vercel.md).

Detener PostgreSQL conservando los datos:

```bash
docker compose down
```

El volumen `postgres_data` mantiene la información entre reinicios. Eliminar
el volumen borra los datos locales y solo debe hacerse de manera intencional.

Si una base de prueba registra los nombres históricos, seguir el procedimiento
para bases descartables de la [guía de desarrollo](development.md#docker-y-base-de-datos).

## Reglas para cambios del esquema

1. Crear una migración nueva y descriptiva.
2. Definir `up` y `down`.
3. Proteger integridad con nulabilidad, unicidad, índices y claves foráneas.
4. Aplicar la migración sobre una base local.
5. Ejecutar pruebas.
6. Documentar cualquier cambio visible en el contrato de la API.
7. Commitear la migración junto con modelos, pruebas y documentación asociados.
