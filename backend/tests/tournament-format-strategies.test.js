import { describe, expect, it } from "vitest";

import FreeForAllTournamentStrategy, {
  FREE_FOR_ALL_MIN_PARTICIPANTS,
} from "../strategies/tournament-formats/FreeForAllTournamentStrategy.js";
import GauntletTournamentStrategy, {
  GAUNTLET_MIN_PARTICIPANTS,
} from "../strategies/tournament-formats/GauntletTournamentStrategy.js";
import GroupsPlayoffTournamentStrategy from "../strategies/tournament-formats/GroupsPlayoffTournamentStrategy.js";
import LeagueTournamentStrategy, {
  LEAGUE_MIN_PARTICIPANTS,
} from "../strategies/tournament-formats/LeagueTournamentStrategy.js";
import SingleEliminationTournamentStrategy, {
  isPowerOfTwo,
  SINGLE_ELIMINATION_MIN_PARTICIPANTS,
} from "../strategies/tournament-formats/SingleEliminationTournamentStrategy.js";
import SwissTournamentStrategy, {
  SWISS_MIN_PARTICIPANTS,
} from "../strategies/tournament-formats/SwissTournamentStrategy.js";
import TournamentFormatStrategy from "../strategies/tournament-formats/TournamentFormatStrategy.js";
import {
  getImplementedTournamentFormatStrategies,
  getTournamentFormatStrategy,
} from "../strategies/tournament-formats/tournament-format-strategy.registry.js";

describe("estrategias de formato de torneo", () => {
  it("define un contrato que no puede instanciarse directamente", () => {
    expect(() => new TournamentFormatStrategy("test")).toThrow(
      "TournamentFormatStrategy es una interfaz",
    );
  });

  it("selecciona las estrategias implementadas desde el registro", () => {
    const leagueStrategy = getTournamentFormatStrategy("league");
    const singleEliminationStrategy =
      getTournamentFormatStrategy("single_elimination");
    const groupsPlayoffStrategy = getTournamentFormatStrategy("groups_playoff");
    const swissStrategy = getTournamentFormatStrategy("swiss");
    const freeForAllStrategy = getTournamentFormatStrategy("free_for_all");
    const gauntletStrategy = getTournamentFormatStrategy("gauntlet");

    expect(leagueStrategy).toBeInstanceOf(LeagueTournamentStrategy);
    expect(leagueStrategy?.format).toBe("league");
    expect(singleEliminationStrategy).toBeInstanceOf(
      SingleEliminationTournamentStrategy,
    );
    expect(singleEliminationStrategy?.format).toBe("single_elimination");
    expect(groupsPlayoffStrategy).toBeInstanceOf(
      GroupsPlayoffTournamentStrategy,
    );
    expect(groupsPlayoffStrategy?.format).toBe("groups_playoff");
    expect(swissStrategy).toBeInstanceOf(SwissTournamentStrategy);
    expect(swissStrategy?.format).toBe("swiss");
    expect(freeForAllStrategy).toBeInstanceOf(FreeForAllTournamentStrategy);
    expect(freeForAllStrategy?.format).toBe("free_for_all");
    expect(gauntletStrategy).toBeInstanceOf(GauntletTournamentStrategy);
    expect(gauntletStrategy?.format).toBe("gauntlet");
    expect(getImplementedTournamentFormatStrategies()).toEqual([
      leagueStrategy,
      singleEliminationStrategy,
      groupsPlayoffStrategy,
      swissStrategy,
      freeForAllStrategy,
      gauntletStrategy,
    ]);
  });

  it("devuelve null para un formato desconocido", () => {
    expect(getTournamentFormatStrategy("unknown")).toBeNull();
  });

  it("acepta una Liga con tres o más participantes", () => {
    const strategy = new LeagueTournamentStrategy();

    expect(LEAGUE_MIN_PARTICIPANTS).toBe(3);
    expect(strategy.validate({ maxParticipants: 3 })).toEqual([]);
    expect(strategy.validate({ maxParticipants: 12 })).toEqual([]);
  });

  it("rechaza una Liga con menos de tres participantes", () => {
    const strategy = new LeagueTournamentStrategy();

    expect(strategy.validate({ maxParticipants: 2 })).toEqual([
      {
        path: ["maxParticipants"],
        message: "Una liga necesita al menos 3 participantes",
      },
    ]);
  });

  it("acepta potencias de dos en Eliminacion simple", () => {
    const strategy = new SingleEliminationTournamentStrategy();

    expect(SINGLE_ELIMINATION_MIN_PARTICIPANTS).toBe(2);
    expect(isPowerOfTwo(2)).toBe(true);
    expect(isPowerOfTwo(8)).toBe(true);
    expect(isPowerOfTwo(32)).toBe(true);
    expect(strategy.validate({ maxParticipants: 16 })).toEqual([]);
  });

  it("rechaza cupos que no forman una llave completa", () => {
    const strategy = new SingleEliminationTournamentStrategy();

    expect(isPowerOfTwo(3)).toBe(false);
    expect(isPowerOfTwo(12)).toBe(false);
    expect(strategy.validate({ maxParticipants: 6 })).toEqual([
      {
        path: ["maxParticipants"],
        message:
          "La eliminacion simple necesita un cupo que sea potencia de 2 (2, 4, 8, 16...)",
      },
    ]);
  });

  it("acepta una configuracion coherente de Grupos + Playoff", () => {
    const strategy = new GroupsPlayoffTournamentStrategy();

    expect(
      strategy.validate({
        maxParticipants: 20,
        playoffSpots: 8,
        groupCount: 4,
        maxParticipantsPerGroup: 5,
      }),
    ).toEqual([]);
  });

  it("exige toda la configuracion de Grupos + Playoff", () => {
    const strategy = new GroupsPlayoffTournamentStrategy();

    expect(strategy.validate({ maxParticipants: 16 })).toEqual([
      {
        path: ["playoffSpots"],
        message: "Debe indicar la cantidad de lugares del playoff",
      },
      {
        path: ["groupCount"],
        message: "Debe indicar la cantidad de grupos",
      },
      {
        path: ["maxParticipantsPerGroup"],
        message: "Debe indicar el maximo de participantes por grupo",
      },
    ]);
  });

  it("rechaza una configuracion que no puede completar el playoff", () => {
    const strategy = new GroupsPlayoffTournamentStrategy();
    const issues = strategy.validate({
      maxParticipants: 12,
      playoffSpots: 8,
      groupCount: 3,
      maxParticipantsPerGroup: 4,
    });

    expect(issues).toContainEqual({
      path: ["groupCount"],
      message:
        "La cantidad de grupos debe dividir exactamente los lugares del playoff",
    });
  });

  it("exige que la fase de grupos elimine participantes y derive el cupo", () => {
    const strategy = new GroupsPlayoffTournamentStrategy();
    const issues = strategy.validate({
      maxParticipants: 18,
      playoffSpots: 8,
      groupCount: 4,
      maxParticipantsPerGroup: 2,
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        {
          path: ["maxParticipantsPerGroup"],
          message:
            "El maximo por grupo debe ser mayor que los clasificados por grupo",
        },
        {
          path: ["maxParticipants"],
          message: "El cupo maximo debe ser 8 segun la configuracion de grupos",
        },
      ]),
    );
  });

  it("acepta una configuracion valida del formato Suizo", () => {
    const strategy = new SwissTournamentStrategy();

    expect(SWISS_MIN_PARTICIPANTS).toBe(4);
    expect(strategy.validate({ maxParticipants: 16, swissRounds: 5 })).toEqual(
      [],
    );
  });

  it("exige al menos cuatro participantes y una cantidad de rondas", () => {
    const strategy = new SwissTournamentStrategy();

    expect(strategy.validate({ maxParticipants: 3 })).toEqual([
      {
        path: ["maxParticipants"],
        message: "Un torneo Suizo necesita al menos 4 participantes",
      },
      {
        path: ["swissRounds"],
        message: "Debe indicar la cantidad de rondas del torneo Suizo",
      },
    ]);
  });

  it("rechaza mas rondas que rivales distintos", () => {
    const strategy = new SwissTournamentStrategy();

    expect(strategy.validate({ maxParticipants: 8, swissRounds: 8 })).toEqual([
      {
        path: ["swissRounds"],
        message:
          "Las rondas no pueden superar la cantidad de rivales distintos disponibles",
      },
    ]);
  });

  it("acepta un Free-for-all con tres o mas participantes", () => {
    const strategy = new FreeForAllTournamentStrategy();

    expect(FREE_FOR_ALL_MIN_PARTICIPANTS).toBe(3);
    expect(strategy.validate({ maxParticipants: 3 })).toEqual([]);
    expect(strategy.validate({ maxParticipants: 24 })).toEqual([]);
  });

  it("rechaza un Free-for-all con menos de tres participantes", () => {
    const strategy = new FreeForAllTournamentStrategy();

    expect(strategy.validate({ maxParticipants: 2 })).toEqual([
      {
        path: ["maxParticipants"],
        message: "Un torneo Free-for-all necesita al menos 3 participantes",
      },
    ]);
  });

  it("acepta un Gauntlet con dos o mas participantes", () => {
    const strategy = new GauntletTournamentStrategy();

    expect(GAUNTLET_MIN_PARTICIPANTS).toBe(2);
    expect(strategy.validate({ maxParticipants: 2 })).toEqual([]);
    expect(strategy.validate({ maxParticipants: 12 })).toEqual([]);
  });

  it("rechaza un Gauntlet con menos de dos participantes", () => {
    const strategy = new GauntletTournamentStrategy();

    expect(strategy.validate({ maxParticipants: 1 })).toEqual([
      {
        path: ["maxParticipants"],
        message: "Un torneo Gauntlet necesita al menos 2 participantes",
      },
    ]);
  });
});
