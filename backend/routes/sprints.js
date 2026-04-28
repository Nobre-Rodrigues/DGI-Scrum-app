const express = require('express');
const { sql, poolPromise } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get sprints for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('projectId', sql.Int, req.params.projectId)
      .query('SELECT * FROM Sprints WHERE project_id = @projectId ORDER BY start_date DESC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create sprint
router.post('/', authenticateToken, authorizeRoles('Scrum Master', 'Product Owner', 'Director'), async (req, res) => {
  const { project_id, name, start_date, end_date, status } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('project_id', sql.Int, project_id)
      .input('name', sql.NVarChar, name)
      .input('start_date', sql.Date, start_date)
      .input('end_date', sql.Date, end_date)
      .input('status', sql.NVarChar, status || 'planned')
      .query(`
        INSERT INTO Sprints (project_id, name, start_date, end_date, status)
        OUTPUT INSERTED.*
        VALUES (@project_id, @name, @start_date, @end_date, @status)
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update sprint
router.put('/:id', authenticateToken, authorizeRoles('Scrum Master', 'Product Owner', 'Director'), async (req, res) => {
  const { name, start_date, end_date, status } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('name', sql.NVarChar, name)
      .input('start_date', sql.Date, start_date)
      .input('end_date', sql.Date, end_date)
      .input('status', sql.NVarChar, status)
      .query('UPDATE Sprints SET name = @name, start_date = @start_date, end_date = @end_date, status = @status OUTPUT INSERTED.* WHERE id = @id');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Sprint not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add backlog item to sprint
router.post('/:id/backlog/:backlogId', authenticateToken, authorizeRoles('Scrum Master', 'Product Owner', 'Director'), async (req, res) => {
  // This would update the backlog item to committed if added to sprint
  // For simplicity, just update status
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('backlogId', sql.Int, req.params.backlogId)
      .query('UPDATE BacklogItems SET status = \'Committed\' WHERE id = @backlogId');
    res.json({ message: 'Backlog item added to sprint' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/start', authenticateToken, authorizeRoles('Scrum Master', 'Product Owner', 'Director'), async (req, res) => {
  try {
    const pool = await poolPromise;
    const sprintResult = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Sprints WHERE id = @id');

    const sprint = sprintResult.recordset[0];

    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    if (!sprint.start_date || !sprint.end_date) {
      return res.status(400).json({ message: 'Defina as datas do sprint antes de o iniciar.' });
    }

    const backlogCountResult = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT COUNT(*) AS total FROM BacklogItems WHERE sprint_id = @id');

    if (backlogCountResult.recordset[0].total === 0) {
      return res.status(400).json({ message: 'Adicione pelo menos um backlog item antes de iniciar o sprint.' });
    }

    await pool.request()
      .input('projectId', sql.Int, sprint.project_id)
      .input('id', sql.Int, req.params.id)
      .query(`
        UPDATE Sprints
        SET status = CASE WHEN id = @id THEN 'active' ELSE status END
        WHERE project_id = @projectId AND status = 'planned'
      `);

    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        UPDATE Sprints
        SET status = 'active'
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
