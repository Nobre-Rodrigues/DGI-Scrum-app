const express = require('express');
const { sql, poolPromise } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { buildPermissions } = require('../services/authorizationService');

const router = express.Router();

router.get('/context', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query(`
        SELECT TOP 1
          u.id,
          u.username,
          u.display_name AS displayName,
          u.email,
          u.role,
          u.is_active AS isActive,
          d.id AS divisionId,
          d.name AS divisionName,
          d.code AS divisionCode
        FROM Users u
        LEFT JOIN Divisions d ON d.id = u.division_id
        WHERE u.id = @id
      `);

    const currentUser = result.recordset[0];
    if (!currentUser) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    res.json(currentUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/permissions', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query(`
        SELECT TOP 1
          u.id,
          u.role,
          d.code AS divisionCode
        FROM Users u
        LEFT JOIN Divisions d ON d.id = u.division_id
        WHERE u.id = @id
      `);

    const currentUser = result.recordset[0];
    if (!currentUser) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    res.json(buildPermissions(currentUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
