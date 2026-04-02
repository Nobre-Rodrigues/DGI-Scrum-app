const express = require('express');
const { sql, poolPromise } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// List users (Product Owner admin)
router.get('/', authenticateToken, authorizeRoles('Product Owner'), async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT id, username, email, role FROM Users ORDER BY username');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user (Product Owner admin)
router.put('/:id', authenticateToken, authorizeRoles('Product Owner'), async (req, res) => {
  const { username, email, role } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .input('role', sql.NVarChar, role)
      .query('UPDATE Users SET username = @username, email = @email, role = @role, updated_at = GETDATE() OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.role WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete user (Product Owner admin)
router.delete('/:id', authenticateToken, authorizeRoles('Product Owner'), async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Users WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
