# Alcance funcional del producto

Este documento describe qué problema busca resolver el sistema, quiénes lo
utilizarán y qué funcionalidades están implementadas o planificadas. No
reemplaza la documentación técnica ni implica que todo el alcance ya exista.

## Objetivo

Centralizar la creación, administración y seguimiento de torneos. Los
organizadores podrán configurar competencias, administrar equipos, registrar
resultados y consultar posiciones. Los participantes podrán consultar sus
equipos, inscripciones, partidas y estadísticas.

## Roles previstos

Los roles pertenecen al alcance planificado. La autenticación y la autorización
todavía no están implementadas.

### Administrador

- Gestionar usuarios y permisos.
- Administrar torneos, equipos y categorías.
- Consultar estadísticas generales.
- Resolver situaciones que requieran privilegios globales.

### Organizador

- Crear y configurar torneos.
- Administrar estados, fechas, modalidad y cupos.
- Gestionar inscripciones.
- Generar enfrentamientos y cargar resultados.
- Consultar tablas de posiciones.

### Participante

- Administrar su perfil.
- Integrar equipos.
- Inscribirse en torneos mediante un equipo.
- Consultar partidas, resultados y posiciones.

## Estado por módulo

| Módulo                   | Estado                 | Alcance actual                                                                                          |
| ------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Torneos                  | En desarrollo avanzado | CRUD y listado completo en API y frontend; el detalle permite abrir inscripciones                       |
| Equipos                  | En desarrollo avanzado | CRUD y listado con búsqueda y paginación en API y frontend; integrantes disponibles todavía solo en API |
| Inscripciones            | En desarrollo avanzado | Alta, retiro lógico, cupos, duplicados y listado en API y desde el detalle del torneo                   |
| Reportes                 | Prototipo implementado | PDF por torneo con información general, ocupación y equipos activos                                     |
| Usuarios y autenticación | Pendiente              | Los IDs numéricos se almacenan sin claves foráneas definitivas hacia `users`                            |
| Partidas y resultados    | Base de datos iniciada | Migraciones y modelos disponibles; todavía sin endpoints, reglas de aplicación ni pantallas             |
| Clasificaciones          | Base de datos iniciada | Tabla y modelo de posiciones disponibles; el cálculo automático todavía está pendiente                  |
| Estadísticas             | Pendiente              | Solo existen espacios planificados en la interfaz                                                       |

## Reglas implementadas

- Un torneo comienza en estado `draft`.
- Las transiciones de estado siguen un flujo controlado.
- Solo los torneos `draft` pueden eliminarse físicamente.
- Un equipo registra automáticamente a su capitán como integrante.
- Un usuario no puede repetirse dentro del mismo equipo.
- El capitán no puede eliminarse de su equipo.
- Solo un torneo `open` admite altas o retiros de inscripciones.
- El cupo no puede superarse aunque existan solicitudes concurrentes.
- Retirar un equipo conserva el historial mediante el estado `withdrawn`.
- Un equipo con historial de inscripciones no puede eliminarse.

## Funcionalidades planificadas

1. Registro, inicio de sesión, perfiles y permisos.
2. Integración de organizadores, capitanes e integrantes con usuarios reales.
3. Gestión de integrantes desde el frontend.
4. Completar las transiciones posteriores al estado `open` desde el detalle del torneo.
5. Generación de enfrentamientos según la modalidad.
6. Registro de resultados e historial de partidas.
7. Cálculo de victorias, derrotas, empates, puntos y posiciones.
8. Estadísticas de torneos, equipos y participantes.
9. Ampliar los reportes con resultados, posiciones y estadísticas.
10. Despliegue conectado del frontend, la API y la base de datos.

## Fuera del alcance actual

No deben presentarse como funcionalidades terminadas:

- autenticación mediante JWT;
- roles y permisos efectivos;
- gestión de partidas o resultados mediante API o frontend;
- cálculo de clasificaciones automáticas;
- estadísticas reales;
- integración referencial con la tabla `users`;
- despliegue productivo.

Estas capacidades pueden figurar como objetivos futuros, pero la documentación
y las demostraciones deben diferenciarlas claramente del comportamiento actual.
