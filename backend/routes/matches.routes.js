'use strict';
const express = require('express');
const router = express.Router();
const matchesController = require('../controllers/matches.controller');

// Rutas para manejar partidos y posiciones del torneo
router.post('/tournaments/:tournamentId/generate', matchesController.generate);
router.get('/tournaments/:tournamentId/matches', matchesController.getByTournament);
router.post('/matches/:id/result', matchesController.setResult);
router.get('/tournaments/:tournamentId/standings', matchesController.getStandings);

module.exports = router;