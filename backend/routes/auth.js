const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { sql, poolPromise } = require('../config/db');
const { ROLE_NAMES } = require('../constants/team');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [Diretor, Subdiretor, Chefe da Divisão de Gestão da Informação, Chefe da Divisão de Análise da Informação, Chefe da Divisão de Sistemas de Informação, Desenvolvedor, Product Owner, Scrum Master, Development Team Member, Stakeholder, Director]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
router.post('/register', [
  body('username').isLength({ min: 3 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(ROLE_NAMES),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, role, divisionId } = req.body;
  try {
    const pool = await poolPromise;

    // Check duplicates to return clear errors instead of 500
    const existingUser = await pool.request()
      .input('email', sql.NVarChar, email)
      .input('username', sql.NVarChar, username)
      .query('SELECT id FROM Users WHERE email = @email OR username = @username');

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ message: 'Username or email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.request()
      .input('username', sql.NVarChar, username)
      .input('display_name', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .input('password_hash', sql.NVarChar, hashedPassword)
      .input('role', sql.NVarChar, role)
      .input('division_id', sql.Int, divisionId || null)
      .query('INSERT INTO Users (username, display_name, email, password_hash, role, division_id) VALUES (@username, @display_name, @email, @password_hash, @role, @division_id)');
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    if (err.number === 547) {
      return res.status(400).json({ message: 'The selected role is not currently allowed by the database configuration' });
    }
    res.status(500).json({ message: 'Could not register user' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT
          u.*,
          d.name AS division_name,
          d.code AS division_code
        FROM Users u
        LEFT JOIN Divisions d ON d.id = u.division_id
        WHERE u.email = @email
      `);
    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = result.recordset[0];
    if (!user.is_active) {
      return res.status(403).json({ message: 'User is inactive' });
    }
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role, divisionId: user.division_id, divisionCode: user.division_code },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name || user.username,
        email: user.email,
        role: user.role,
        divisionId: user.division_id,
        divisionName: user.division_name,
        divisionCode: user.division_code,
        isActive: user.is_active,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
