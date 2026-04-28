const express = require('express');
const { poolPromise } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT id, name, code, is_active AS isActive
        FROM Divisions
        ORDER BY name
      `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
