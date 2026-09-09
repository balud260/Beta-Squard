const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
  getSimulationScenarios,
  startSimulation,
  getSimulationStatus,
  escalateSimulation,
  resetSimulation,
  getExerciseReport
} = require('../services/disaster/disasterSimulationService');

/**
 * GET /api/simulation/scenarios - List pre-built demo simulation scenarios
 */
router.get('/scenarios', authenticateToken, (req, res) => {
  try {
    const scenarios = getSimulationScenarios();
    res.json({ scenarios });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch simulation scenarios.' });
  }
});

/**
 * POST /api/simulation/start - Start a new disaster exercise
 */
router.post('/start', authenticateToken, authorizeRoles('GOVERNMENT'), (req, res) => {
  try {
    const { scenarioKey, mode, customConfig } = req.body;
    const result = startSimulation(scenarioKey || 'vijayawada_flood', mode || 'FAST', customConfig || {}, req.user.id);
    res.status(201).json({
      message: 'Disaster simulation exercise started successfully.',
      ...result
    });
  } catch (error) {
    console.error('Start simulation error:', error);
    res.status(500).json({ error: 'Failed to start disaster simulation exercise.' });
  }
});

/**
 * GET /api/simulation/:id/status - Fetch live exercise state & timeline
 */
router.get('/:id/status', authenticateToken, (req, res) => {
  try {
    const simulationId = req.params.id;
    const status = getSimulationStatus(simulationId);
    res.json(status);
  } catch (error) {
    console.error('Fetch simulation status error:', error);
    res.status(500).json({ error: 'Failed to fetch simulation status.' });
  }
});

/**
 * POST /api/simulation/:id/escalate - Escalate simulation severity
 */
router.post('/:id/escalate', authenticateToken, authorizeRoles('GOVERNMENT'), (req, res) => {
  try {
    const simulationId = req.params.id;
    const { severity } = req.body;
    const updated = escalateSimulation(simulationId, severity || 'CRITICAL', req.user.id);
    res.json({
      message: `Simulation severity escalated to ${severity || 'CRITICAL'}.`,
      ...updated
    });
  } catch (error) {
    console.error('Escalate simulation error:', error);
    res.status(500).json({ error: error.message || 'Failed to escalate simulation.' });
  }
});

/**
 * POST /api/simulation/:id/reset - Safely reset simulation exercise
 */
router.post('/:id/reset', authenticateToken, authorizeRoles('GOVERNMENT'), (req, res) => {
  try {
    const simulationId = req.params.id;
    const result = resetSimulation(simulationId, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Reset simulation error:', error);
    res.status(500).json({ error: 'Failed to reset simulation exercise.' });
  }
});

/**
 * GET /api/simulation/:id/report - Retrieve complete Exercise Report summary
 */
router.get('/:id/report', authenticateToken, (req, res) => {
  try {
    const simulationId = req.params.id;
    const report = getExerciseReport(simulationId);
    res.json({ report });
  } catch (error) {
    console.error('Exercise report error:', error);
    res.status(500).json({ error: 'Failed to generate exercise report.' });
  }
});

module.exports = router;
