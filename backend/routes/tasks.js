const express = require('express');
const { sql, poolPromise } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get tasks for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('projectId', sql.Int, req.params.projectId)
      .query(`
        SELECT t.*, u.username as assigned_username, b.project_id, b.title AS backlog_title
        FROM Tasks t
        JOIN BacklogItems b ON b.id = t.backlog_item_id
        LEFT JOIN Users u ON t.assigned_to = u.id
        WHERE b.project_id = @projectId
        ORDER BY
          CASE WHEN t.work_item_id IS NULL THEN 0 ELSE 1 END,
          ISNULL(t.work_item_id, 0),
          ISNULL(t.sort_order, 2147483647),
          t.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get tasks for a backlog item
router.get('/backlog/:backlogId', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('backlogId', sql.Int, req.params.backlogId)
      .query(`
        SELECT t.*, u.username as assigned_username
        FROM Tasks t
        LEFT JOIN Users u ON t.assigned_to = u.id
        WHERE backlog_item_id = @backlogId
        ORDER BY
          CASE WHEN t.work_item_id IS NULL THEN 0 ELSE 1 END,
          ISNULL(t.work_item_id, 0),
          ISNULL(t.sort_order, 2147483647),
          t.created_at
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create task
router.post('/', authenticateToken, async (req, res) => {
  const {
    backlog_item_id,
    title,
    description,
    assigned_to,
    priority,
    estimated_hours,
    planned_start_date,
    planned_end_date,
    work_type,
    work_item_id,
    sort_order,
  } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('backlog_item_id', sql.Int, backlog_item_id)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('assigned_to', sql.Int, assigned_to)
      .input('priority', sql.NVarChar, priority || 'Média')
      .input('estimated_hours', sql.Decimal(10, 2), estimated_hours || null)
      .input('planned_start_date', sql.Date, planned_start_date || null)
      .input('planned_end_date', sql.Date, planned_end_date || null)
      .input('work_type', sql.NVarChar, work_type || null)
      .input('work_item_id', sql.Int, work_item_id || null)
      .input('sort_order', sql.Int, sort_order || null)
      .query(`
        INSERT INTO Tasks (
          backlog_item_id, title, description, assigned_to, priority, estimated_hours,
          planned_start_date, planned_end_date, work_type, work_item_id, sort_order
        )
        OUTPUT INSERTED.*
        VALUES (
          @backlog_item_id, @title, @description, @assigned_to, @priority, @estimated_hours,
          @planned_start_date, @planned_end_date, @work_type, @work_item_id, @sort_order
        )
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update task
router.put('/:id', authenticateToken, async (req, res) => {
  const {
    title,
    description,
    status,
    assigned_to,
    priority,
    estimated_hours,
    planned_start_date,
    planned_end_date,
    work_type,
    work_item_id,
    sort_order,
  } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('status', sql.NVarChar, status)
      .input('assigned_to', sql.Int, assigned_to)
      .input('priority', sql.NVarChar, priority || 'Média')
      .input('estimated_hours', sql.Decimal(10, 2), estimated_hours || null)
      .input('planned_start_date', sql.Date, planned_start_date || null)
      .input('planned_end_date', sql.Date, planned_end_date || null)
      .input('work_type', sql.NVarChar, work_type || null)
      .input('work_item_id', sql.Int, work_item_id || null)
      .input('sort_order', sql.Int, sort_order || null)
      .query(`
        UPDATE Tasks
        SET title = @title,
            description = @description,
            status = @status,
            assigned_to = @assigned_to,
            priority = @priority,
            estimated_hours = @estimated_hours,
            planned_start_date = @planned_start_date,
            planned_end_date = @planned_end_date,
            work_type = @work_type,
            work_item_id = @work_item_id,
            sort_order = @sort_order,
            updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
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
