const express = require('express');
const { sql, poolPromise } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get tasks for a backlog item
router.get('/backlog/:backlogId', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('backlogId', sql.Int, req.params.backlogId)
      .query('SELECT t.*, u.username as assigned_username FROM Tasks t LEFT JOIN Users u ON t.assigned_to = u.id WHERE backlog_item_id = @backlogId ORDER BY created_at');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create task
router.post('/', authenticateToken, async (req, res) => {
  const { backlog_item_id, title, description, assigned_to } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('backlog_item_id', sql.Int, backlog_item_id)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('assigned_to', sql.Int, assigned_to)
      .query('INSERT INTO Tasks (backlog_item_id, title, description, assigned_to) OUTPUT INSERTED.* VALUES (@backlog_item_id, @title, @description, @assigned_to)');
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update task
router.put('/:id', authenticateToken, async (req, res) => {
  const { title, description, status, assigned_to } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('status', sql.NVarChar, status)
      .input('assigned_to', sql.Int, assigned_to)
      .query('UPDATE Tasks SET title = @title, description = @description, status = @status, assigned_to = @assigned_to, updated_at = GETDATE() OUTPUT INSERTED.* WHERE id = @id');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Tasks WHERE id = @id');
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;