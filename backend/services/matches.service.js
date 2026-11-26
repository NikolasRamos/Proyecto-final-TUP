'use strict';
const { Match, Result, Standing, Team, Tournament, sequelize } = require('../models');

// Función interna para recalcular las tablas de posiciones de un torneo.
// Se ejecuta cada vez que se carga o modifica un resultado para mantener todo sincronizado.
async function recalculateStandings(tournamentId, transaction) {
  // Buscamos todas las partidas que ya terminaron en este torneo
  const matches = await Match.findAll({
    where: { tournamentId, status: 'finished' },
    include: [{ model: Result, as: 'result' }],
    transaction
  });

  // Identificamos qué equipos participaron en al menos un partido finalizado
  const teamIdsSet = new Set();
  matches.forEach(m => {
    teamIdsSet.add(m.homeTeamId);
    teamIdsSet.add(m.awayTeamId);
  });

  // Inicializamos un mapa para llevar las cuentas de cada equipo (puntos, PJ, G, E, P, goles)
  const statsMap = {};
  teamIdsSet.forEach(teamId => {
    statsMap[teamId] = {
      tournamentId,
      teamId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0
    };
  });

  
  matches.forEach(m => {
    if (!m.result) return;
    const homeId = m.homeTeamId;
    const awayId = m.awayTeamId;
    const hScore = m.result.homeScore;
    const aScore = m.result.awayScore;

    if (!statsMap[homeId]) statsMap[homeId] = { tournamentId, teamId: homeId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 };
    if (!statsMap[awayId]) statsMap[awayId] = { tournamentId, teamId: awayId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 };

    statsMap[homeId].played += 1;
    statsMap[awayId].played += 1;

    statsMap[homeId].goalsFor += hScore;
    statsMap[homeId].goalsAgainst += aScore;
    statsMap[awayId].goalsFor += aScore;
    statsMap[awayId].goalsAgainst += hScore;

    // Lógica de 3 puntos por victoria, 1 por empate
    if (hScore > aScore) {
      statsMap[homeId].won += 1;
      statsMap[homeId].points += 3;
      statsMap[awayId].lost += 1;
    } else if (hScore < aScore) {
      statsMap[awayId].won += 1;
      statsMap[awayId].points += 3;
      statsMap[homeId].lost += 1;
    } else {
      statsMap[homeId].drawn += 1;
      statsMap[homeId].points += 1;
      statsMap[awayId].drawn += 1;
      statsMap[awayId].points += 1;
    }
  });

  // Calculamos la diferencia de goles para cada equipo
  Object.values(statsMap).forEach(st => {
    st.goalDifference = st.goalsFor - st.goalsAgainst;
  });

  // Limpiamos los standings viejos de este torneo y guardamos los nuevos actualizados
  await Standing.destroy({ where: { tournamentId }, transaction });
  
  const statsArray = Object.values(statsMap);
  if (statsArray.length > 0) {
    await Standing.bulkCreate(statsArray, { transaction });
  }
}

class MatchesService {
  
  // Genera los cruces de tipo todos contra todos (Round Robin) para un torneo
  async generateFixtures(tournamentId) {
    const tournament = await Tournament.findByPk(tournamentId);
    if (!tournament) throw new Error('No se encontró el torneo indicado');

    // Traemos los equipos inscriptos (por simplicidad traemos una lista de equipos activos)
    const teams = await Team.findAll({ limit: 10 }); 
    if (teams.length < 2) throw new Error('Hacen falta al menos 2 equipos para armar el fixture');

    const tTeams = [...teams];
    // Si la cantidad de equipos es impar, agrega un "null" para representar fecha libre
    if (tTeams.length % 2 !== 0) {
      tTeams.push(null);
    }

    const numTeams = tTeams.length;
    const rounds = numTeams - 1;
    const half = numTeams / 2;
    const createdMatches = [];

    // Usa transacción por seguridad para que o se armen todos los partidos o no se guarde nada
    await sequelize.transaction(async (t) => {
      // Borram partidos anteriores por si se vuelve a generar el fixture
      await Match.destroy({ where: { tournamentId }, transaction: t });

      for (let r = 0; r < rounds; r++) {
        const roundName = `Fecha ${r + 1}`;
        for (let i = 0; i < half; i++) {
          const home = tTeams[i];
          const away = tTeams[numTeams - 1 - i];

          if (home && away) {
            const match = await Match.create({
              tournamentId,
              homeTeamId: home.id,
              awayTeamId: away.id,
              round: roundName,
              status: 'scheduled'
            }, { transaction: t });
            createdMatches.push(match);
          }
        }
        // Rotación clásica de equipos para el algoritmo de round-robin (dejamos al primero fijo)
        tTeams.splice(1, 0, tTeams.pop());
      }
    });

    return createdMatches;
  }

  // Trae todas las fechas/partidas de un torneo con los nombres de los equipos y su resultado si lo hay
  async getMatchesByTournament(tournamentId) {
    return await Match.findAll({
      where: { tournamentId },
      include: [
        { model: Team, as: 'homeTeam', attributes: ['id', 'name'] },
        { model: Team, as: 'awayTeam', attributes: ['id', 'name'] },
        { model: Result, as: 'result' }
      ],
      order: [['createdAt', 'ASC']]
    });
  }

  // Registra o actualiza el resultado de un partido y dispara el recálculo de la tabla
  async registerResult(matchId, { homeScore, awayScore }) {
    return await sequelize.transaction(async (t) => {
      const match = await Match.findByPk(matchId, { transaction: t });
      if (!match) throw new Error('La partida no existe');

      let result = await Result.findOne({ where: { matchId }, transaction: t });
      if (result) {
        // Si ya tenía resultado, lo pisa con el nuevo
        result.homeScore = homeScore;
        result.awayScore = awayScore;
        await result.save({ transaction: t });
      } else {
        // Si es la primera vez que se carga, lo crea de cero
        result = await Result.create({ matchId, homeScore, awayScore }, { transaction: t });
      }

      // Marcam el partido como finalizado
      match.status = 'finished';
      await match.save({ transaction: t });

      // Actualizam automáticamente la tabla de posiciones del torneo
      await recalculateStandings(match.tournamentId, t);

      return { match, result };
    });
  }

  // Devuelve la tabla de posiciones ordenada por puntos, diferencia de goles y goles a favor
  async getStandings(tournamentId) {
    return await Standing.findAll({
      where: { tournamentId },
      include: [{ model: Team, as: 'team', attributes: ['id', 'name'] }],
      order: [
        ['points', 'DESC'],
        ['goalDifference', 'DESC'],
        ['goalsFor', 'DESC']
      ]
    });
  }
}

module.exports = new MatchesService();