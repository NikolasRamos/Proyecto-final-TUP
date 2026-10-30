# Diagrama entidad-relación

El diagrama representa el esquema implementado para torneos, equipos,
integrantes e inscripciones después de simplificar los identificadores del
prototipo a enteros autoincrementales.

```mermaid
erDiagram
    TOURNAMENTS {
        int id PK
        varchar name
        text description "Opcional"
        varchar modality
        int max_participants
        date registration_deadline
        date start_date
        date end_date
        varchar status
        int organizer_id "Referencia futura a users"
        timestamp created_at
        timestamp updated_at
    }

    TEAMS {
        int id PK
        varchar name
        text description "Opcional"
        int captain_id "Referencia futura a users"
        timestamp created_at
        timestamp updated_at
    }

    TEAM_MEMBERS {
        int id PK
        int team_id FK
        int user_id "Referencia futura a users"
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

    TOURNAMENTS ||--o{ TOURNAMENT_REGISTRATIONS : "recibe inscripciones"
    TEAMS ||--o{ TOURNAMENT_REGISTRATIONS : "se inscribe"
    TEAMS ||--o{ TEAM_MEMBERS : "tiene integrantes"
```

## Restricciones relevantes

- `team_members.team_id` referencia a `teams.id` con actualización y borrado
  en cascada.
- `tournament_registrations.tournament_id` referencia a `tournaments.id`.
- `tournament_registrations.team_id` referencia a `teams.id`.
- La combinación de torneo y equipo es única en
  `tournament_registrations`.
- La combinación de equipo y usuario es única en `team_members`.
- `organizer_id`, `captain_id` y `user_id` son referencias lógicas. Todavía no
  tienen claves foráneas porque el módulo `users` está pendiente de integración.
