'use strict';
const matchesService = require('../services/matches.service');

class MatchesController {
  
  // Endpoint para generar el fixture de un torneo
  async generate(req, res) {
    try {
      const { tournamentId } = req.params;
      const matches = await matchesService.generateFixtures(tournamentId);
      return res.status(201).json({ message: 'Fixture armado correctamente', matches });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Endpoint para listar partidos de un torneo
  async getByTournament(req, res) {
    try {
      const { tournamentId } = req.params;
      const matches = await matchesService.getMatchesByTournament(tournamentId);
      return res.status(200).json(matches);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Endpoint para cargar o editar el resultado de un partido
  async setResult(req, res) {
    try {
      const { id } = req.params; // ID de la partida
      const { homeScore, awayScore } = req.body;
      const data = await matchesService.registerResult(id, { homeScore, awayScore });
      return res.status(200).json({ message: 'Resultado guardado y posiciones al día', ...data });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Endpoint para consultar la tabla de posiciones
  async getStandings(req, res) {
    try {
      const { tournamentId } = req.params;
      const standings = await matchesService.getStandings(tournamentId);
      return res.status(200).json(standings);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new MatchesController();