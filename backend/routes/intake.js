const express = require('express');
const { sql, poolPromise } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const APPROVAL_STATUSES = ['approved', 'frozen', 'no_capacity'];

// Get all intake requests (Director sees all, others see their own)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    let query;
    if (req.user.role === 'Director') {
      query = pool.request().query(`
        SELECT ir.*, u.username AS requested_by_name
        FROM IntakeRequests ir
        JOIN Users u ON ir.requested_by = u.id
        ORDER BY ir.created_at DESC
      `);
    } else {
      query = pool.request()
        .input('requested_by', sql.Int, req.user.id)
        .query(`
          SELECT ir.*, u.username AS requested_by_name
          FROM IntakeRequests ir
          JOIN Users u ON ir.requested_by = u.id
          WHERE ir.requested_by = @requested_by
          ORDER BY ir.created_at DESC
        `);
    }
    const result = await query;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single intake request
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT ir.*, u.username AS requested_by_name
        FROM IntakeRequests ir
        JOIN Users u ON ir.requested_by = u.id
        WHERE ir.id = @id
      `);
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Intake request not found' });
    }
    const intake = result.recordset[0];
    // Non-directors can only see their own
    if (req.user.role !== 'Director' && intake.requested_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(intake);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit new intake request (any authenticated user)
router.post('/', authenticateToken, async (req, res) => {
  const { title, description, business_justification, start_date, completion_date } = req.body;
  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }
  if (start_date && completion_date && start_date > completion_date) {
    return res.status(400).json({ message: 'Start date cannot be after completion date' });
  }
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('business_justification', sql.NVarChar, business_justification || null)
      .input('start_date', sql.Date, start_date || null)
      .input('completion_date', sql.Date, completion_date || null)
      .input('approval_status', sql.NVarChar, 'pending')
      .input('requested_by', sql.Int, req.user.id)
      .query(`
        INSERT INTO IntakeRequests (title, description, business_justification, start_date, completion_date, approval_status, requested_by)
        OUTPUT INSERTED.*
        VALUES (@title, @description, @business_justification, @start_date, @completion_date, @approval_status, @requested_by)
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update intake approval status (Director only)
router.put('/:id/approval-status', authenticateToken, authorizeRoles('Director'), async (req, res) => {
  const { approval_status, director_notes } = req.body;
  if (!APPROVAL_STATUSES.includes(approval_status)) {
    return res.status(400).json({ message: 'Invalid approval status' });
  }
  try {
    const pool = await poolPromise;

    const intakeResult = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM IntakeRequests WHERE id = @id');
    if (intakeResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Intake request not found' });
    }
    const intake = intakeResult.recordset[0];
    if ((intake.approval_status || 'pending') !== 'pending') {
      return res.status(400).json({ message: 'Approval status has already been defined' });
    }

    let project = null;
    let projectId = null;

    if (approval_status === 'approved') {
      const projectResult = await pool.request()
        .input('name', sql.NVarChar, intake.title)
        .input('description', sql.NVarChar, intake.description)
        .input('start_date', sql.Date, intake.start_date || null)
        .input('end_date', sql.Date, intake.completion_date || null)
        .input('product_owner_id', sql.Int, intake.requested_by)
        .query(`
          INSERT INTO Projects (name, description, start_date, end_date, product_owner_id)
          OUTPUT INSERTED.*
          VALUES (@name, @description, @start_date, @end_date, @product_owner_id)
        `);
      project = projectResult.recordset[0];
      projectId = project.id;
    }

    const updated = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('status', sql.NVarChar, 'processed')
      .input('approval_status', sql.NVarChar, approval_status)
      .input('director_notes', sql.NVarChar, director_notes || null)
      .input('project_id', sql.Int, projectId)
      .query(`
        UPDATE IntakeRequests
        SET status = @status,
            approval_status = @approval_status,
            director_notes = @director_notes,
            project_id = @project_id,
            updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    res.json({ intake: updated.recordset[0], project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
