const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { poolPromise, sql } = require('../config/db');
const { getProjectDashboardSummary } = require('../repositories/projectDashboardRepository');
const { PROJECT_STATUSES, PRIORITIES } = require('../constants/projectMetadata');
const { logProjectUpdate } = require('../services/projectUpdates');

const router = express.Router();

router.get('/:projectId/dashboard', authenticateToken, async (req, res) => {
  try {
    const summary = await getProjectDashboardSummary(Number(req.params.projectId));

    if (!summary) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:projectId/updates/recent', authenticateToken, async (req, res) => {
  try {
    const summary = await getProjectDashboardSummary(Number(req.params.projectId));

    if (!summary) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(summary.metrics.updatesLast7Days.items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:projectId/tasks/recent', authenticateToken, async (req, res) => {
  try {
    const summary = await getProjectDashboardSummary(Number(req.params.projectId));

    if (!summary) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(summary.metrics.tasksCreatedLast7Days.items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:projectId/planned', authenticateToken, async (req, res) => {
  try {
    const summary = await getProjectDashboardSummary(Number(req.params.projectId));

    if (!summary) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(summary.metrics.plannedNext7Days.items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:projectId/status', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('projectId', sql.Int, req.params.projectId)
      .query('SELECT id, status FROM Projects WHERE id = @projectId');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:projectId/status', authenticateToken, authorizeRoles('Product Owner', 'Scrum Master', 'Director'), [
  body('status').isIn(PROJECT_STATUSES),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('projectId', sql.Int, req.params.projectId)
      .input('status', sql.NVarChar, req.body.status)
      .query(`
        UPDATE Projects
        SET status = @status, updated_at = GETDATE()
        OUTPUT INSERTED.id, INSERTED.status
        WHERE id = @projectId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await logProjectUpdate({
      pool,
      projectId: Number(req.params.projectId),
      entityType: 'Project',
      entityId: Number(req.params.projectId),
      changeType: 'status_updated',
      changedBy: req.user.id,
      description: `Estado do projeto atualizado para "${req.body.status}".`,
    });

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:projectId/capacity', authenticateToken, async (req, res) => {
  try {
    const summary = await getProjectDashboardSummary(Number(req.params.projectId));

    if (!summary) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(summary.teamCapacity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:projectId/priorities', authenticateToken, async (req, res) => {
  try {
    const summary = await getProjectDashboardSummary(Number(req.params.projectId));

    if (!summary) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(summary.priorities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:projectId/priorities/:entityType/:entityId', authenticateToken, authorizeRoles('Product Owner', 'Scrum Master', 'Director'), [
  body('priority').isIn(PRIORITIES),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const entityType = req.params.entityType;
  const entityId = Number(req.params.entityId);
  const tableName = entityType === 'backlog' ? 'BacklogItems' : entityType === 'work-item' ? 'WorkItems' : null;

  if (!tableName) {
    return res.status(400).json({ message: 'Invalid entity type' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('entityId', sql.Int, entityId)
      .input('priority', sql.NVarChar, req.body.priority)
      .query(`
        UPDATE ${tableName}
        SET priority = @priority, updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @entityId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const projectId = entityType === 'backlog'
      ? Number(req.params.projectId)
      : Number(result.recordset[0].project_id);

    await logProjectUpdate({
      pool,
      projectId,
      entityType: entityType === 'backlog' ? 'BacklogItem' : 'WorkItem',
      entityId,
      changeType: 'priority_updated',
      changedBy: req.user.id,
      description: `Prioridade atualizada para "${req.body.priority}".`,
    });

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

