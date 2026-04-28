const express = require('express');
const { sql, poolPromise } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

const normalizeBacklogPriority = (priority) => {
  const value = String(priority || '').trim();

  switch (value) {
    case 'Crítica':
    case 'Alta':
    case 'Must':
      return 'Must';
    case 'Média':
    case 'Should':
      return 'Should';
    case 'Baixa':
    case 'Could':
      return 'Could';
    case "Won't":
      return "Won't";
    default:
      return 'Should';
  }
};

// Get backlog items for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('projectId', sql.Int, req.params.projectId)
      .query(`
        SELECT b.*, s.name AS sprint_name
        FROM BacklogItems b
        LEFT JOIN Sprints s ON s.id = b.sprint_id
        WHERE b.project_id = @projectId
        ORDER BY CASE WHEN b.sprint_id IS NULL THEN 1 ELSE 0 END, b.priority, b.created_at
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create backlog item
router.post('/', authenticateToken, authorizeRoles('Product Owner', 'Scrum Master', 'Director'), async (req, res) => {
  const { project_id, title, description, story_points, priority, definition_of_done, sprint_id } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('project_id', sql.Int, project_id)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('story_points', sql.Int, story_points)
      .input('priority', sql.NVarChar, normalizeBacklogPriority(priority))
      .input('definition_of_done', sql.NVarChar, definition_of_done || null)
      .input('sprint_id', sql.Int, sprint_id || null)
      .query(`
        INSERT INTO BacklogItems (project_id, title, description, story_points, priority, definition_of_done, sprint_id)
        OUTPUT INSERTED.*
        VALUES (@project_id, @title, @description, @story_points, @priority, @definition_of_done, @sprint_id)
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update backlog item
router.put('/:id', authenticateToken, authorizeRoles('Product Owner', 'Scrum Master', 'Director'), async (req, res) => {
  const { title, description, story_points, priority, status, definition_of_done, sprint_id } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('story_points', sql.Int, story_points)
      .input('priority', sql.NVarChar, normalizeBacklogPriority(priority))
      .input('status', sql.NVarChar, status)
      .input('definition_of_done', sql.NVarChar, definition_of_done || null)
      .input('sprint_id', sql.Int, sprint_id || null)
      .query(`
        UPDATE BacklogItems
        SET title = @title,
            description = @description,
            story_points = @story_points,
            priority = @priority,
            status = @status,
            definition_of_done = @definition_of_done,
            sprint_id = @sprint_id,
            updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Backlog item not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete backlog item
router.delete('/:id', authenticateToken, authorizeRoles('Product Owner'), async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM BacklogItems WHERE id = @id');
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Backlog item not found' });
    }
    res.json({ message: 'Backlog item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/sprint', authenticateToken, authorizeRoles('Product Owner', 'Scrum Master', 'Director'), async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('sprint_id', sql.Int, req.body.sprint_id || null)
      .query(`
        UPDATE BacklogItems
        SET sprint_id = @sprint_id,
            status = CASE WHEN @sprint_id IS NULL THEN status ELSE 'Committed' END,
            updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Backlog item not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
