# Registro de patrones de diseño

Este documento registra las decisiones relacionadas con los patrones de diseño
del proyecto. Debe actualizarse cada vez que se aplique, modifique o descarte
un patrón después de analizar un problema concreto.

La arquitectura por capas, los controladores, los servicios, los modelos de
Sequelize y las migraciones no se registran automáticamente como patrones GoF.
Son decisiones arquitectónicas y herramientas del proyecto, pero no implican
por sí mismas la aplicación de Factory, Builder, Singleton, Adapter, Decorator,
Facade, Observer, Strategy o Command.

## Patrones aplicados

Actualmente no se implementó ningún patrón GoF formal. Los casos desarrollados
hasta ahora se resuelven con servicios pequeños y explícitos, sin una repetición
o variación suficiente que justifique agregar otra abstracción.

Cuando se aplique un patrón, se incorporará una entrada con este formato:

| Fecha | Patrón | Categoría | Ubicación | Problema | Beneficios | Costos |
| ----- | ------ | --------- | --------- | -------- | ---------- | ------ |
| —     | —      | —         | —         | —        | —          | —      |

## Decisiones evaluadas

### Facade para inscripciones de equipos

- **Fecha:** 2026-10-12.
- **Categoría:** estructural.
- **Ubicación evaluada:** flujo de inscripción en
  `backend/services/registrations.service.js`.
- **Problema considerado:** la inscripción coordina torneos, equipos, cupos,
  duplicados y transacciones.
- **Beneficio esperado:** ofrecer un único punto de entrada y ocultar la
  coordinación entre varios componentes.
- **Costo esperado:** agregar una clase y una capa adicional, junto con más
  pruebas y mantenimiento.
- **Decisión:** no aplicar por ahora. Solo existe un caso de uso y el servicio de
  inscripciones ya concentra el flujo de manera clara.
- **Reconsiderar cuando:** se incorporen pagos, aprobación manual,
  notificaciones, listas de espera u otros procesos que reutilicen la misma
  coordinación.

### Command para retirar equipos de torneos

- **Fecha:** 2026-10-12.
- **Categoría:** comportamiento.
- **Ubicación evaluada:** retiro de inscripciones en
  `backend/services/registrations.service.js`.
- **Problema considerado:** representar el retiro de un equipo como una acción
  independiente.
- **Beneficio esperado:** permitir encolar, auditar, reintentar o deshacer la
  operación.
- **Costo esperado:** agregar objetos de comando, ejecutores y pruebas para un
  flujo que actualmente es sincrónico y directo.
- **Decisión:** no aplicar por ahora. Una función transaccional expresa toda la
  operación sin perder claridad.
- **Reconsiderar cuando:** las acciones deban procesarse en segundo plano,
  conservar una auditoría detallada o admitir reintentos y deshacer.

## Posibles usos futuros

Estas posibilidades no representan patrones aplicados. Deben volver a
evaluarse cuando aparezca el problema correspondiente.

| Patrón   | Posible problema futuro                                         |
| -------- | --------------------------------------------------------------- |
| Strategy | Generar enfrentamientos con distintas modalidades de torneo.    |
| Factory  | Seleccionar y construir la estrategia según la modalidad.       |
| Observer | Actualizar posiciones, estadísticas y notificaciones.           |
| Facade   | Coordinar inscripciones con pagos, cupos y aprobaciones.        |
| Command  | Ejecutar acciones auditables, reintentables o en segundo plano. |

## Criterio de decisión

Antes de incorporar un patrón se seguirá este proceso:

1. Identificar un problema real o una variación repetida.
2. Considerar primero una solución directa y más sencilla.
3. Comparar los beneficios del patrón con su complejidad y mantenimiento.
4. Acordar con el equipo si el costo está justificado.
5. Implementarlo y registrar aquí su ubicación y motivo.
