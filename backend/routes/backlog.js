const express = require('express');
const { sql, poolPromise } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get backlog items for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('projectId', sql.Int, req.params.projectId)
      .query('SELECT * FROM BacklogItems WHERE project_id = @projectId ORDER BY priority, created_at');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create backlog item
router.post('/', authenticateToken, authorizeRoles('Product Owner', 'Scrum Master'), async (req, res) => {
  const { project_id, title, description, story_points, priority } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('project_id', sql.Int, project_id)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('story_points', sql.Int, story_points)
      .input('priority', sql.NVarChar, priority)
      .query('INSERT INTO BacklogItems (project_id, title, description, story_points, priority) OUTPUT INSERTED.* VALUES (@project_id, @title, @description, @story_points, @priority)');
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update backlog item
router.put('/:id', authenticateToken, authorizeRoles('Product Owner', 'Scrum Master'), async (req, res) => {
  const { title, description, story_points, priority, status } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('story_points', sql.Int, story_points)
      .input('priority', sql.NVarChar, priority)
      .input('status', sql.NVarChar, status)
      .query('UPDATE BacklogItems SET title = @title, description = @description, story_points = @story_points, priority = @priority, status = @status, updated_at = GETDATE() OUTPUT INSERTED.* WHERE id = @id');
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

module.exports = router;