const express = require('express');
const { sql, poolPromise } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Projects');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create project (Product Owner only)
router.post('/', authenticateToken, authorizeRoles('Product Owner'), async (req, res) => {
  const { name, description, start_date, end_date, status } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description)
      .input('start_date', sql.Date, start_date || null)
      .input('end_date', sql.Date, end_date || null)
      .input('status', sql.NVarChar, status || 'Não iniciado')
      .input('product_owner_id', sql.Int, req.user.id)
      .query(`
        INSERT INTO Projects (name, description, start_date, end_date, status, product_owner_id)
        OUTPUT INSERTED.*
        VALUES (@name, @description, @start_date, @end_date, @status, @product_owner_id)
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get project by id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Projects WHERE id = @id');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update project (Product Owner only)
router.put('/:id', authenticateToken, authorizeRoles('Product Owner'), async (req, res) => {
  const { name, description, start_date, end_date, status } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description)
      .input('start_date', sql.Date, start_date || null)
      .input('end_date', sql.Date, end_date || null)
      .input('status', sql.NVarChar, status || 'Não iniciado')
      .query(`
        UPDATE Projects
        SET name = @name,
            description = @description,
            start_date = @start_date,
            end_date = @end_date,
            status = @status,
            updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete project (Product Owner only)
router.delete('/:id', authenticateToken, authorizeRoles('Product Owner'), async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Projects WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
