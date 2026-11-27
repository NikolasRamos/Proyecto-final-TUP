# Diagrama entidad-relación

El diagrama representa el esquema de la API, incluidas las cuentas, las
membresías y los planteles inscritos. Las líneas muestran claves foráneas
existentes. Las referencias lógicas a cuentas se indican en cada campo.

```mermaid
erDiagram
    ROL {
        int idRol PK
        varchar nombre UK
        timestamp createdAt
        timestamp updatedAt
    }

    USUARIO {
        int idUsuario PK
        int idRol FK
        varchar nombre
        varchar email UK
        varchar password "Hash"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "Baja lógica"
    }

    TOURNAMENTS {
        int id PK
        varchar name
        text description "Opcional"
        varchar modality
        int max_participants
        boolean is_team_tournament
        int min_team_members "Opcional"
        int max_team_members "Opcional"
        int playoff_spots "Opcional"
        int group_count "Opcional"
        int max_participants_per_group "Opcional"
        int swiss_rounds "Opcional"
        date registration_deadline
        date start_date
        date end_date
        varchar status
        int organizer_id "Identificador histórico"
        int organizer_account_id "Vínculo lógico opcional a usuario"
        timestamp created_at
        timestamp updated_at
    }

    TEAMS {
        int id PK
        varchar name
        text description "Opcional"
        int captain_id "Identificador histórico"
        int captain_account_id "Vínculo lógico opcional a usuario"
        timestamp created_at
        timestamp updated_at
    }

    TEAM_MEMBERS {
        int id PK
        int team_id FK
        int user_id "Identificador lógico"
        boolean account_linked
        timestamp created_at
        timestamp updated_at
    }

    TOURNAMENT_REGISTRATIONS {
        int id PK
        int tournament_id FK
        int team_id FK
        varchar status
        timestamp created_at
        timestamp updated_at
    }

    TOURNAMENT_REGISTRATION_MEMBERS {
        int id PK
        int registration_id FK
        int user_id "Identificador del integrante seleccionado"
        timestamp created_at
        timestamp updated_at
    }

    TEAM_MEMBERSHIP_REQUESTS {
        int id PK
        int team_id FK
        int user_id "Vínculo lógico a usuario"
        int initiator_id "Vínculo lógico a usuario"
        varchar kind
        varchar status
        timestamp created_at
        timestamp updated_at
    }

    TEAM_NOTIFICATION_READS {
        int request_id PK, FK
        int user_id PK
        varchar event PK
        timestamp read_at
    }

    MATCHES {
        int id PK
        int tournament_id FK
        int home_team_id FK
        int away_team_id FK
        varchar status
        varchar round "Opcional"
        timestamp match_date "Opcional"
        timestamp created_at
        timestamp updated_at
    }

    RESULTS {
        int id PK
        int match_id FK
        int home_score
        int away_score
        timestamp created_at
        timestamp updated_at
    }

    STANDINGS {
        int id PK
        int tournament_id FK
        int team_id FK
        int played
        int won
        int drawn
        int lost
        int goals_for
        int goals_against
        int goal_difference
        int points
        timestamp created_at
        timestamp updated_at
    }

    ROL ||--o{ USUARIO : "define permisos"
    TOURNAMENTS ||--o{ TOURNAMENT_REGISTRATIONS : "recibe inscripciones"
    TOURNAMENT_REGISTRATIONS ||--o{ TOURNAMENT_REGISTRATION_MEMBERS : "selecciona plantel"
    TEAMS ||--o{ TEAM_MEMBERSHIP_REQUESTS : "recibe trámites"
    TEAM_MEMBERSHIP_REQUESTS ||--o{ TEAM_NOTIFICATION_READS : "registra lecturas"
    TEAMS ||--o{ TOURNAMENT_REGISTRATIONS : "se inscribe"
    TEAMS ||--o{ TEAM_MEMBERS : "tiene integrantes"
    TOURNAMENTS ||--o{ MATCHES : "programa partidos"
    TEAMS ||--o{ MATCHES : "disputa partidos"
    MATCHES ||--o| RESULTS : "registra resultado"
    TOURNAMENTS ||--o{ STANDINGS : "tiene posiciones"
    TEAMS ||--o{ STANDINGS : "ocupa una posición"
```

## Restricciones relevantes

- `team_members.team_id` referencia a `teams.id` con actualización y borrado
  en cascada.
- `tournament_registrations.tournament_id` referencia a `tournaments.id`.
- `tournament_registrations.team_id` referencia a `teams.id`.
- La combinación de torneo y equipo es única en
  `tournament_registrations`.
- La combinación de equipo y usuario es única en `team_members`.
- Cada partido relaciona un torneo con dos equipos diferentes.
- `results.match_id` es único, por lo que cada partido tiene como máximo un
  resultado.
- La combinación de torneo y equipo es única en `standings`.
- `organizer_account_id`, `captain_account_id` y los IDs de cuenta de
  membresías y avisos son vínculos lógicos. La aplicación valida las cuentas
  activas al ejecutar las acciones correspondientes.
- Las solicitudes e invitaciones comparten un índice único parcial por equipo
  y cuenta mientras están pendientes. Las lecturas se identifican por trámite,
  cuenta y evento.
- Las tablas de partidas, resultados y posiciones forman parte del esquema.
  Su integración en la API sigue pendiente.
