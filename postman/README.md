# Colección de Postman

Esta carpeta contiene una copia versionada y entregable de las peticiones de la
API. No contiene contraseñas, tokens ni otros secretos.

## Archivos

- `Gestion-Torneos.postman_collection.json`: colección de la API para importar y entregar.
- `Local.postman_environment.json`: ambiente local con la URL y los campos de prueba, sin credenciales ni tokens precargados.
- `../docs/api.md`: referencia escrita de parámetros, reglas y respuestas.

## Importar en Postman

1. Abrir Postman y seleccionar **Import**.
2. Seleccionar los dos archivos JSON de esta carpeta.
3. Elegir el ambiente **Local - Gestión de torneos**.
4. Abrir la colección **Gestión de torneos - API**.
5. Ejecutar primero `01 - Salud > Comprobar API`.

Si la API está iniciada, la comprobación debe responder `200 OK`.

## Variables utilizadas

| Variable       | Uso                                                    |
| -------------- | ------------------------------------------------------ |
| `baseUrl`      | Dirección de la API local                              |
| `tournamentId` | Torneo utilizado en consultas, cambios e inscripciones |
| `teamId`       | Equipo utilizado en consultas y operaciones            |
| `captainId`    | Usuario capitán al crear un equipo                     |
| `userId`       | Usuario utilizado para agregar o retirar integrantes   |
| `teamActorToken` | Token de la cuenta que pide ingreso, invita, responde o consulta sus avisos |
| `membershipRequestId` | ID del trámite o `requestId` del aviso que querés marcar como leído |

Las peticiones **Crear torneo** y **Crear equipo** guardan automáticamente los
identificadores devueltos por la API en `tournamentId` y `teamId`. Los demás
identificadores se pueden cambiar desde la pestaña **Variables** de la
colección.

## Pruebas de autenticación y roles

Con la API local iniciada, cargar en el ambiente activo `authName`, `authEmail`
y `authPassword` para una cuenta nueva de prueba. Completar `authAdminEmail` y
`authAdminPassword` con una cuenta administradora de ese mismo ambiente. Los
roles y las cuentas ficticias locales se cargan con `npm run db:seed`. Para un
despliegue nuevo, la [guía de la API](../docs/api.md#primera-cuenta-administradora)
explica cómo habilitar la primera cuenta administradora.

Ejecutar **06 - Autenticación y roles** en este orden:

1. Registrar participante y obtener su ID (`201`).
2. Iniciar sesión como participante y guardar su token (`200`).
3. Consultar la sesión del participante (`200`).
4. Intentar asignar el rol de organizador con ese token (`403`).
5. Iniciar sesión como administrador y guardar su token (`200`).
6. Asignar el rol de organizador a la cuenta del paso 1 (`200`).

Los scripts guardan `authUserId`, `authParticipantToken` y `authAdminToken`
en el ambiente activo. Usar un correo nuevo para repetir la prueba desde el
registro. Para compartir el ambiente, usar el JSON versionado con las
credenciales y tokens vacíos.

Para probar la creación de un equipo propio, después de iniciar sesión con una
cuenta participante ejecutá **03 - Equipos → Crear mi equipo como participante**
mientras esa cuenta siga teniendo ese rol.

## Probar propiedad de torneos y membresías

Para `Mis torneos`, usá el token de la cuenta organizadora en la autorización
de la petición. La carpeta **02 - Torneos** usa por defecto el token de
administrador. Creá el torneo con el token del organizador para que quede
vinculado a esa cuenta y consultalo con la misma sesión. Una segunda cuenta
organizadora solo lo puede consultar si está abierto o en curso.

En **07 - Solicitudes e invitaciones**, usá `teamActorToken` para cambiar de
cuenta entre cada acción. Por ejemplo, enviá un pedido como participante,
copiá su `data.id` a `membershipRequestId` y respondé como capitán del equipo.
Para probar el flujo inverso, invitá como capitán y respondé como la cuenta
invitada. En **08 - Notificaciones**, usá el token de la cuenta que recibió el
aviso y tomá el identificador de su campo `requestId`.

Para probar Vercel, duplicá el ambiente local, cambiá `baseUrl` a
`https://proyecto-final-tup.vercel.app` e iniciá sesión con cuentas registradas
en ese ambiente. [Guía de verificación](../docs/deployment-vercel.md#8-desplegar-y-validar).

## Orden recomendado para una demostración

Las búsquedas de torneos vigentes y equipos se pueden ejecutar como invitado.
Las solicitudes de gestión usan `authAdminToken`. Para obtener el token, ejecutá
**06 - Autenticación y roles → Iniciar sesión como administrador** con una
cuenta administradora del ambiente seleccionado.

1. Comprobar la API.
2. Crear un torneo.
3. Consultar el torneo creado.
4. Crear un equipo.
5. Consultar el equipo y sus integrantes.
6. Agregar otro integrante.
7. Cambiar el torneo de `draft` a `open`.
8. Inscribir el equipo en el torneo seleccionando `captainId` y `userId` como
   integrantes del plantel.
9. Listar los equipos inscritos.

No conviene ejecutar toda la colección como si fuera una única prueba: algunas
operaciones son alternativas entre sí. Por ejemplo, un torneo abierto ya no se
puede eliminar físicamente y un equipo con historial de inscripciones tampoco.

## Guardar y entregar cambios

Cuando se agregue o modifique un endpoint:

1. actualizar la petición correspondiente en Postman;
2. exportar nuevamente la colección en formato **Collection v2.1**;
3. reemplazar `Gestion-Torneos.postman_collection.json`;
4. actualizar `docs/api.md` si cambió el contrato público;
5. comprobar que no se hayan exportado secretos.

Para la entrega se pueden compartir esta carpeta completa o importar la
colección en el espacio de trabajo del grupo y publicar su documentación desde
Postman.
