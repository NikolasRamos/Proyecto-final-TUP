# Diagrama entidad-relación

El diagrama representa el esquema implementado para torneos, equipos,
integrantes, inscripciones, partidos, resultados y posiciones. Todas las
entidades del prototipo utilizan identificadores enteros autoincrementales.

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

    TOURNAMENTS ||--o{ TOURNAMENT_REGISTRATIONS : "recibe inscripciones"
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
- `organizer_id`, `captain_id` y `user_id` son referencias lógicas. Todavía no
  tienen claves foráneas porque el módulo `users` está pendiente de integración.
