# Análisis y decisiones de diseño: torneos, equipos e inscripciones

Documento preparado para la evaluación del bloque de torneos, equipos e
inscripciones. Su objetivo es permitir que cualquier integrante del grupo pueda
ubicar el código, explicar el diagnóstico, comparar alternativas y defender las
decisiones tomadas.

## Estado frente a la consigna

Fecha de revisión inicial: **13 de octubre de 2026**. Última actualización
documental: **25 de octubre de 2026**.

- **Repositorio:**
  [NikolasRamos/Proyecto-final-TUP](https://github.com/NikolasRamos/Proyecto-final-TUP).
- **Rama revisada:** `feature/tournaments-teams`.
- **Commits backend principales:** `b32cc47` y `92906fd`.

| Requisito                                    | Estado del bloque     | Evidencia o acción pendiente                                                                                                                                                                      |
| -------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Proyecto actualizado y repositorio accesible | Parcialmente cumplido | El backend está publicado en `feature/tournaments-teams`, commits `b32cc47` y `92906fd`. Los cambios actuales del frontend y la documentación deben commitearse y subirse antes de la evaluación. |
| Análisis profundo, concreto y documentado    | Cumplido localmente   | Este documento analiza el flujo real de inscripciones y sus decisiones asociadas. Debe estar en el repositorio remoto para completar formalmente el requisito.                                    |
| Código y documentación localizables          | Cumplido localmente   | Las referencias siguientes enlazan servicios, controladores, migraciones y pruebas. Antes de presentar se debe comprobar que la rama esté sincronizada.                                           |

Este estado se limita al bloque analizado. El grupo debe verificar por separado
la documentación y disponibilidad de los bloques de usuarios, autenticación,
partidas, resultados y cualquier otra responsabilidad distribuida.

## Resumen ejecutivo

El problema más delicado del bloque no es el CRUD, sino mantener las reglas de
negocio cuando varios equipos intentan inscribirse en un torneo:

- solo se admiten inscripciones cuando el torneo está `open`;
- el equipo debe existir;
- el cupo máximo no puede superarse;
- un equipo no puede estar inscrito dos veces en el mismo torneo;
- un retiro debe liberar cupo sin borrar el historial;
- un equipo con historial de inscripciones no puede eliminarse;
- dos solicitudes concurrentes no deben ocupar el último cupo simultáneamente.

La solución conserva servicios pequeños, validaciones en el borde de la API,
restricciones en PostgreSQL y transacciones de Sequelize. Se evaluaron patrones
GoF, pero no se aplicó ninguno formal porque el flujo actual sigue siendo único,
sin variantes ni necesidad de encolado, deshacer o coordinación reutilizada.

## 1. Código analizado

### Flujo principal

| Ubicación                                                                                                                        | Responsabilidad                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [`backend/services/registrations.service.js`](../backend/services/registrations.service.js#L8)                                   | Inscribir, retirar y listar equipos en torneos. Contiene las reglas de negocio y las transacciones. |
| [`backend/controllers/registrations.controller.js`](../backend/controllers/registrations.controller.js#L13)                      | Traducir los resultados del servicio a respuestas HTTP `201`, `400`, `404`, `409` y `500`.          |
| [`backend/schemas/registration.schema.js`](../backend/schemas/registration.schema.js#L5)                                         | Validar identificadores, estado y paginación antes de ejecutar el servicio.                         |
| [`backend/models/TournamentRegistration.js`](../backend/models/TournamentRegistration.js#L5)                                     | Representar una inscripción con estados `registered` y `withdrawn`.                                 |
| [`backend/migrations/004-create-tournament-registrations.cjs`](../backend/migrations/004-create-tournament-registrations.cjs#L3) | Crear claves foráneas, unicidad e índices en PostgreSQL.                                            |
| [`backend/routes/tournaments.routes.js`](../backend/routes/tournaments.routes.js#L25)                                            | Exponer los endpoints de creación, retiro y listado.                                                |

### Código relacionado

- Estados y eliminación de torneos:
  [`backend/services/tournaments.service.js`](../backend/services/tournaments.service.js#L3).
- Creación transaccional de equipo y capitán, integrantes y eliminación
  protegida:
  [`backend/services/teams.service.js`](../backend/services/teams.service.js#L6).
- Migración de integrantes y unicidad por equipo:
  [`backend/migrations/003-create-team-members.cjs`](../backend/migrations/003-create-team-members.cjs#L3).
- Pruebas de servicios y rutas:
  [`registrations.service.test.js`](../backend/tests/registrations.service.test.js#L48),
  [`registrations.routes.test.js`](../backend/tests/registrations.routes.test.js#L19),
  [`teams.service.test.js`](../backend/tests/teams.service.test.js#L46) y
  [`teams.routes.test.js`](../backend/tests/teams.routes.test.js#L35).

## 2. Diagnóstico

### 2.1 Integridad y concurrencia del cupo

Una implementación que solamente cuente inscripciones y luego inserte puede
fallar ante dos peticiones simultáneas. Ambas podrían leer que queda un lugar y
crear dos registros, superando `maxParticipants`.

Para evitarlo, `registerTeamInTournament` ejecuta la operación dentro de una
transacción y bloquea la fila del torneo con `LOCK.UPDATE`. Las solicitudes para
el mismo torneo quedan serializadas durante la sección crítica: se comprueba el
estado, el equipo, el duplicado y el cupo antes de crear o reactivar la
inscripción.

Conceptos aplicados:

- transacción atómica;
- bloqueo pesimista de la fila compartida;
- validación de reglas en la capa de servicio;
- restricción única en base de datos como defensa final.

La transacción y el bloqueo son mecanismos de persistencia, no patrones GoF.

### 2.2 Duplicados

La aplicación consulta si ya existe la combinación `tournamentId + teamId` para
devolver un resultado entendible. PostgreSQL también posee un índice único para
esa combinación. La segunda protección cubre una colisión concurrente que
pudiera ocurrir después de la consulta inicial.

El servicio convierte `SequelizeUniqueConstraintError` en el resultado de
negocio `already_registered`, que el controlador traduce a `409 Conflict`.

### 2.3 Conservación del historial

Retirar un equipo no elimina la fila. Cambia el estado de `registered` a
`withdrawn`. Esto permite:

- auditar que el equipo estuvo inscrito;
- consultar equipos retirados;
- liberar el cupo sin perder información;
- reactivar el mismo registro si vuelve a inscribirse y todavía hay lugar.

La contrapartida es que la tabla conserva más filas y todas las consultas de
cupo deben filtrar explícitamente `status: "registered"`.

### 2.4 Eliminación de equipos y torneos

Las claves foráneas de `tournament_registrations` usan `ON DELETE RESTRICT`.
Además, `deleteTeam` consulta el historial y devuelve `has_registrations` antes
de destruir el equipo. El controlador responde `409 Conflict` con un mensaje de
negocio en lugar de exponer un error de PostgreSQL.

Los torneos solo pueden eliminarse en estado `draft`. Una vez abiertos,
iniciados, finalizados o cancelados se conservan como historial.

### 2.5 Separación de responsabilidades

- **Schemas:** validan datos externos.
- **Controladores:** manejan HTTP y códigos de respuesta.
- **Servicios:** contienen las reglas y coordinan modelos/transacciones.
- **Modelos y migraciones:** representan y protegen la persistencia.

Esta separación favorece la responsabilidad única y permite probar las reglas
sin levantar un servidor real. No se afirma que el proyecto aplique todos los
principios SOLID; solo se identifica la separación concreta presente.

### 2.6 Limitación conocida: usuarios

`organizerId`, `captainId` y `userId` validan enteros positivos, pero todavía
no poseen todas las claves foráneas hacia `users`, porque ese módulo corresponde
al bloque 1. La integración futura debe realizarse con migraciones nuevas, sin
reescribir las ya ejecutadas, y debe obtener el usuario autenticado desde JWT.

## 3. Alternativas consideradas

| Problema                                   | Alternativas                                                         | Decisión                                    | Motivo y costo                                                                                                                          |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Evitar exceder el cupo                     | Contar sin transacción; bloqueo transaccional; trigger en PostgreSQL | Transacción y bloqueo de la fila del torneo | Mantiene la regla visible en el servicio y evita carreras. Reduce temporalmente la concurrencia sobre el mismo torneo.                  |
| Evitar inscripciones duplicadas            | Solo consulta previa; solo índice único; ambas defensas              | Consulta previa más índice único            | La consulta mejora el mensaje y la restricción garantiza integridad. Hay una consulta adicional.                                        |
| Retirar un equipo                          | Borrar la fila; conservarla con estado; tabla de auditoría separada  | Estado `withdrawn`                          | Es suficiente para el historial actual. Requiere filtrar las inscripciones activas.                                                     |
| Eliminar un equipo inscrito                | Borrado en cascada; permitir borrado y dejar referencia; restringir  | `RESTRICT` más respuesta `409`              | Prioriza integridad e historial. Impide borrar equipos usados incluso si la inscripción fue retirada.                                   |
| Coordinar el caso de inscripción           | Función de servicio directa; patrón **Facade**                       | Servicio directo                            | Ya existe un único punto de entrada. Una Facade adicional duplicaría esa función y agregaría archivos/pruebas.                          |
| Modelar inscripción y retiro como acciones | Funciones directas; patrón **Command**                               | Funciones directas                          | No existen cola, reintentos, deshacer ni auditoría de comandos. Command agregaría objetos sin beneficio actual.                         |
| Crear entidades                            | Sequelize directo; **Factory**; **Builder**                          | Sequelize más schemas de Zod                | Hay una sola forma de crear cada entidad y el cuerpo completo llega en una petición. Factory/Builder no resolverían variaciones reales. |
| Comunicar reglas esperables                | Lanzar excepciones para todo; devolver resultados `outcome`          | Resultados explícitos                       | El controlador distingue estados esperables sin depender del texto de excepciones. El costo es más ramificación explícita.              |

### Patrones revisados y no aplicados

- **Facade (estructural):** reconsiderar si una inscripción coordina pagos,
  aprobación, lista de espera y notificaciones.
- **Command (comportamiento):** reconsiderar si las acciones deben encolarse,
  reintentarse, auditarse o deshacerse.
- **Strategy (comportamiento):** candidato futuro para generar enfrentamientos
  de liga, eliminación directa o fase de grupos.
- **Factory (creacional):** podría seleccionar la estrategia de generación
  cuando existan varias implementaciones reales.
- **Observer (comportamiento):** candidato para actualizar posiciones,
  estadísticas y notificaciones después de registrar resultados.
- **Builder (creacional):** no es necesario mientras cada entidad tenga un
  único formulario de creación validado por Zod.
- **Singleton (creacional):** el módulo de base de datos exporta una instancia
  compartida, pero no se presenta como una implementación formal del patrón
  Singleton; se aprovecha el sistema de módulos de JavaScript.

No aplicar un patrón también es una decisión de diseño válida. La consigna no
exige una cantidad mínima de patrones y prioriza que cada decisión esté
fundamentada.

## 4. Decisión

Se decidió mantener la solución actual con estas reglas:

1. Controladores HTTP delgados y servicios responsables del negocio.
2. Validaciones de entrada con Zod antes de acceder a persistencia.
3. Transacción y bloqueo del torneo para crear o retirar inscripciones.
4. Restricciones únicas y claves foráneas como última defensa de integridad.
5. Retiro lógico mediante `withdrawn`, conservando el historial.
6. Resultados `outcome` para situaciones esperables y excepciones para fallas
   inesperadas.
7. Ningún patrón GoF formal hasta que exista un problema que justifique su
   complejidad.

La decisión evita sobreingeniería y cubre las reglas actuales. Si el flujo
incorpora pagos, aprobaciones, eventos o procesamiento en segundo plano, deberá
revisarse el límite del servicio y reconsiderar Facade, Command u Observer.

## 5. Evidencia y trade-offs

### Evidencia directa

- Transacción y bloqueo de inscripción:
  [`registrations.service.js`, líneas 8-68](../backend/services/registrations.service.js#L8).
- Retiro lógico transaccional:
  [`registrations.service.js`, líneas 72-106](../backend/services/registrations.service.js#L72).
- Listado paginado con datos básicos del equipo:
  [`registrations.service.js`, líneas 110-156](../backend/services/registrations.service.js#L110).
- Claves foráneas `RESTRICT` e índice único:
  [`004-create-tournament-registrations.cjs`, líneas 13-62](../backend/migrations/004-create-tournament-registrations.cjs#L13).
- Eliminación protegida del equipo:
  [`teams.service.js`, líneas 44-69](../backend/services/teams.service.js#L44).
- Transiciones y eliminación protegida del torneo:
  [`tournaments.service.js`, líneas 3-81](../backend/services/tournaments.service.js#L3).
- Registro ampliado de patrones evaluados:
  [`docs/design-patterns.md`](design-patterns.md).

### Trade-offs asumidos

| Beneficio                                                        | Costo aceptado                                                                         |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| El cupo no se supera con solicitudes concurrentes.               | Las inscripciones del mismo torneo se procesan secuencialmente durante la transacción. |
| Se conserva el historial de retiros.                             | Las consultas deben filtrar el estado y la tabla crece con el historial.               |
| La base impide duplicados y referencias rotas.                   | Algunas eliminaciones dejan de estar permitidas y requieren respuestas `409`.          |
| Los resultados `outcome` hacen explícitas las reglas esperables. | Los controladores contienen varias ramas de traducción a HTTP.                         |
| No hay abstracciones GoF prematuras.                             | Si el caso de uso crece mucho, el servicio deberá refactorizarse.                      |
| El bloque avanzó sin esperar `users`.                            | Hasta integrar el bloque 1, un ID válido no garantiza que el usuario exista.           |

## Pruebas y comprobaciones

### Evolución del listado de torneos (21 de octubre de 2026)

El listado incorporó búsqueda por nombre o descripción, filtros combinables,
paginación y ordenamiento mediante una lista cerrada de campos permitidos. El
ID se utiliza como segundo criterio de orden para que dos registros con el
mismo valor principal mantengan una posición estable entre páginas.

Se consideró encapsular cada criterio mediante **Strategy** o **Specification**,
pero no se aplicaron: actualmente solo existen tres filtros simples que
Sequelize puede combinar directamente. Introducir clases para cada criterio
agregaría archivos y pruebas sin resolver una variación compleja. Esta decisión
deberá revisarse si aparecen búsquedas reutilizables, rangos dinámicos o reglas
distintas según el rol del usuario.

El beneficio de la solución actual es un contrato pequeño y seguro, ya que el
cliente no puede enviar nombres arbitrarios de columnas para ordenar. El costo
es que cada nuevo campo de búsqueda u ordenamiento debe agregarse de forma
explícita al schema y al servicio.

### Identificadores del prototipo (25 de octubre de 2026)

Se evaluaron UUID, enteros autoincrementales y un UUID interno acompañado por
un código público corto. Para el prototipo se eligieron enteros
autoincrementales porque simplifican URLs, formularios, pruebas manuales e
integración con el `idUsuario` entero del módulo de autenticación.

La decisión exige reconstruir las tablas de torneos, equipos, integrantes e
inscripciones. Se aceptó eliminar sus datos porque eran exclusivamente de
prueba. El costo futuro es necesitar una migración si el proyecto adopta UUID.
Para limitar ese costo, la validación y el tipo de identificador se
centralizaron y el resto del sistema no realiza operaciones aritméticas con los
IDs.

No se aplicó un patrón GoF: la variación es un contrato de datos transversal,
no una familia de algoritmos ni un proceso de construcción intercambiable.

El estado local revisado ejecuta:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd test
```

Resultado del 25/10/2026: **15 archivos de prueba y 175 pruebas aprobadas**,
incluyendo las pruebas actuales del frontend. El commit backend `92906fd` fue
subido antes de esas incorporaciones visuales; por eso el número del repositorio
remoto puede ser menor hasta realizar el próximo commit.

Casos importantes cubiertos:

- inscripción válida;
- torneo inexistente o no abierto;
- equipo inexistente;
- inscripción duplicada y colisión de unicidad;
- torneo sin cupo;
- reactivación de una inscripción retirada;
- retiro válido, inexistente o repetido;
- listado de activas y retiradas;
- protección al eliminar equipos con historial;
- validación de identificadores y paginación;
- errores internos sin exponer detalles sensibles.

## Guion sugerido para la explicación grupal

### Demostración breve

1. Mostrar esta documentación y señalar los cinco apartados obligatorios.
2. Abrir `registerTeamInTournament` y explicar la transacción y el bloqueo.
3. Abrir la migración de inscripciones y mostrar `RESTRICT` y el índice único.
4. Abrir una prueba de cupo, duplicado o reactivación.
5. Explicar por qué el retiro cambia el estado en lugar de borrar la fila.
6. Explicar por qué Facade y Command se evaluaron pero no se aplicaron.
7. Mostrar la limitación pendiente de integración con `users`.

### Diagnóstico en una frase

> El riesgo principal era perder integridad por inscripciones concurrentes o
> borrar historial; se resolvió con transacciones, bloqueo, restricciones de
> base de datos y retiro lógico, sin agregar patrones que todavía no aportan un
> beneficio concreto.

### Preguntas individuales probables

**¿Por qué usan una transacción?**
Porque validar cupo y crear o reactivar la inscripción debe ser una operación
atómica. Si falla un paso, no debe quedar un estado parcial.

**¿Por qué bloquean la fila del torneo?**
Para que dos solicitudes simultáneas no lean el mismo último cupo como
disponible.

**¿Por qué hay consulta de duplicado e índice único?**
La consulta permite responder con claridad; el índice garantiza la integridad
incluso si ocurre una carrera entre solicitudes.

**¿Por qué no borran una inscripción retirada?**
Porque el historial es información del dominio y permite auditar o reactivar la
inscripción.

**¿Por qué no usaron Facade?**
El servicio ya es el único punto de entrada del caso de uso. Otra capa no
ocultaría complejidad adicional en el estado actual.

**¿Por qué no usaron Command?**
Las acciones son sincrónicas y no necesitan cola, reintento, deshacer ni
auditoría de comandos.

**¿Qué patrón usarían para las modalidades?**
Strategy para encapsular cada algoritmo de generación de enfrentamientos y,
si hace falta seleccionar la implementación, una Factory.

**¿Qué cambiará al integrar usuarios?**
Se agregarán claves foráneas mediante nuevas migraciones, asociaciones de
Sequelize y autorización basada en el usuario obtenido del JWT.

**¿Cuál es el costo del bloqueo?**
Las operaciones sobre el mismo torneo esperan mientras la transacción está
activa. Se acepta porque prioriza no exceder el cupo.

## Preparación antes de la evaluación

### En la computadora que se presentará

```powershell
git switch feature/tournaments-teams
git pull --ff-only origin feature/tournaments-teams
npm install
docker compose up -d postgres
npm.cmd run db:migrate
npm.cmd test
npm.cmd run dev
```

Si PowerShell bloquea `npm.ps1`, utilizar `npm.cmd`, como en los comandos
anteriores.

### Lista de control del grupo

- [ ] Commitear y subir el frontend y este documento.
- [ ] Confirmar que GitHub muestra `docs/decisiones-diseno.md`.
- [ ] Confirmar que todos tienen acceso al repositorio y a la rama elegida.
- [ ] Decidir si se presenta esta rama o si se combina con `main`.
- [ ] Abrir Docker Desktop antes de iniciar la demostración.
- [ ] Ejecutar migraciones y pruebas en la computadora de presentación.
- [ ] Tener Postman preparado con los endpoints de torneos, equipos e
      inscripciones.
- [ ] Repartir quién explica código, diagnóstico, alternativas, decisión y
      trade-offs.
- [ ] Repasar preguntas de las clases 4 a 7, aunque el patrón consultado no esté
      implementado.
- [ ] Cada integrante debe poder abrir una función propia y explicar por qué
      está diseñada de esa manera.

## Conclusión

El bloque de torneos, equipos e inscripciones cumple técnicamente el análisis
pedido y posee evidencia concreta en código y pruebas. Para cumplir la consigna
de forma verificable durante la evaluación todavía es indispensable subir este
documento y los cambios locales del frontend, acordar la rama que se mostrará y
comprobar el entorno de presentación.
