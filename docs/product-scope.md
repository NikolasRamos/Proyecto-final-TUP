# Alcance funcional del prototipo

El Grupo 16 desarrolla una aplicación para organizar torneos, administrar equipos e inscripciones y consultar la información de cada competencia.

## Acceso y permisos

El registro público crea una cuenta con rol participante. La API usa la cuenta de la sesión y consulta su rol actual antes de ejecutar una operación protegida.

| Perfil | Acciones disponibles |
| --- | --- |
| Invitado | Buscar y consultar torneos abiertos o en curso y consultar el catálogo de equipos. |
| Participante | Además de consultar los catálogos, puede crear un equipo como capitán, pedir ingreso a otro equipo y responder sus invitaciones. |
| Organizador | Crea torneos a nombre de su cuenta y ve sus torneos privados junto con los torneos públicos del catálogo. Puede gestionar sus propios torneos, sus inscripciones y su reporte. El rol también habilita la edición de equipos y la gestión directa de integrantes. |
| Administrador | Puede gestionar todos los torneos y equipos, vincular capitanes a cuentas activas y asignar roles a cuentas participantes mediante la API. |

Cualquier cuenta con sesión puede usar **Mis equipos**, **Solicitudes** y **Notificaciones**. El capitán vinculado puede enviar invitaciones y responder pedidos de ingreso. Solo el capitán vinculado o un administrador puede eliminar un equipo, y el historial de inscripciones bloquea esa operación.

**Mis torneos** muestra los torneos que creó la cuenta autenticada. Los torneos de demostración sin organizador vinculado quedan bajo gestión administrativa. La [referencia de la API](api.md) detalla los permisos por operación.

## Funcionalidades disponibles

| Módulo | Implementación |
| --- | --- |
| Torneos | Búsqueda, filtros, orden, paginación, detalle, creación, edición y eliminación de borradores. Seis formatos con validaciones específicas. |
| Equipos | Catálogo, detalle, creación, edición, eliminación, integrantes y asignación de capitanes. El catálogo admite búsqueda y paginación. |
| Membresías | Solicitudes e invitaciones con aceptación o rechazo. **Mis equipos** muestra las membresías vinculadas a la cuenta. |
| Notificaciones | Bandeja privada con avisos de solicitudes e invitaciones, estado de lectura y acceso al trámite. |
| Inscripciones | Alta, listado y retiro de equipos desde el detalle del torneo. El organizador selecciona el plantel que representa al equipo. |
| Reportes | PDF con datos del torneo, ocupación y equipos activos. |
| Usuarios | Registro, inicio y cierre de sesión, consulta de la cuenta y asignación de roles desde Postman. |
| Entorno de entrega | Aplicación pública en [Vercel](https://proyecto-final-tup.vercel.app/) con PostgreSQL administrado en Neon. |

## Reglas del dominio

- Los torneos comienzan en borrador. Solo los borradores se eliminan físicamente.
- Liga, Eliminación simple, Grupos + Playoff, Suizo, Free-for-all y Gauntlet validan sus cupos y su configuración mediante [Strategy y reglas compartidas](design-patterns.md).
- Grupos + Playoff deriva el cupo total de la cantidad de grupos y su tamaño. Suizo limita las rondas a la cantidad de rivales distintos.
- Las inscripciones de equipos se gestionan mientras el torneo está abierto. Un retiro libera el cupo y conserva la fila con estado `withdrawn`.
- Los pedidos e invitaciones pendientes son únicos por cuenta y equipo. La aprobación registra o vincula la membresía.
- Los torneos individuales se pueden configurar. La inscripción disponible en esta versión es por equipos.

## Funcionalidades pendientes

- Inscripción de participantes individuales y controles de interfaz para las transiciones posteriores a la apertura de inscripciones.
- Integración del calendario de Liga y de sus resultados y posiciones. El repositorio contiene su trabajo inicial y el esquema de datos. Las rutas de partidas permanecen deshabilitadas mientras se completa la integración.
- Generación de enfrentamientos de los demás formatos, estadísticas y reportes con resultados.
