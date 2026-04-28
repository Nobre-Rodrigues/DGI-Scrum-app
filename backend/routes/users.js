const express = require('express');
const bcrypt = require('bcryptjs');
const { sql, poolPromise } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const {
  canManageAllDivisions,
  canManageUsers,
  canManageTargetUser,
  getManagedDivisionCode,
} = require('../services/authorizationService');
const { logAuditEvent } = require('../services/auditLogService');
const { validateUserPayload } = require('../services/userValidationService');

const router = express.Router();

const baseUserSelect = `
  SELECT
    u.id,
    u.username,
    u.display_name AS displayName,
    u.email,
    u.role,
    u.division_id AS divisionId,
    d.name AS divisionName,
    d.code AS divisionCode,
    u.job_title AS jobTitle,
    u.is_active AS isActive,
    u.created_at AS createdAt,
    u.updated_at AS updatedAt
  FROM Users u
  LEFT JOIN Divisions d ON d.id = u.division_id
`;

const getCurrentUserContext = async (userId) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('id', sql.Int, userId)
    .query(`
      SELECT TOP 1
        u.id,
        u.username,
        u.display_name AS displayName,
        u.email,
        u.role,
        u.division_id AS divisionId,
        d.code AS divisionCode,
        d.name AS divisionName,
        u.is_active AS isActive
      FROM Users u
      LEFT JOIN Divisions d ON d.id = u.division_id
      WHERE u.id = @id
    `);
  return result.recordset[0] || null;
};

router.get('/assignable', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getCurrentUserContext(req.user.id);
    const pool = await poolPromise;

    let query = `${baseUserSelect} WHERE u.is_active = 1`;

    if (!canManageUsers(currentUser)) {
      query += ' AND u.id = @currentUserId';
    }

    query += ' ORDER BY u.display_name, u.username';

    const request = pool.request().input('currentUserId', sql.Int, req.user.id);
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getCurrentUserContext(req.user.id);
    if (!currentUser) {
      return res.status(401).json({ message: 'Utilizador autenticado não encontrado.' });
    }

    const pool = await poolPromise;
    let query = baseUserSelect;
    const request = pool.request().input('currentUserId', sql.Int, currentUser.id);

    if (canManageUsers(currentUser)) {
      if (!canManageAllDivisions(currentUser) && getManagedDivisionCode(currentUser.role)) {
        query += ' WHERE d.code = @divisionCode';
        request.input('divisionCode', sql.NVarChar, currentUser.divisionCode);
      }
    } else {
      query += ' WHERE u.id = @currentUserId';
    }

    query += ' ORDER BY u.display_name, u.username';
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getCurrentUserContext(req.user.id);
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`${baseUserSelect} WHERE u.id = @id`);

    const targetUser = result.recordset[0];

    if (!targetUser) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    if (targetUser.id !== currentUser.id && !canManageTargetUser(currentUser, targetUser.divisionCode)) {
      return res.status(403).json({ message: 'Sem permissões para consultar este utilizador.' });
    }

    res.json(targetUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { displayName, email, role, divisionId, jobTitle, isActive = true, password } = req.body;

  const validationError = validateUserPayload({ displayName, email, role, divisionId });
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const currentUser = await getCurrentUserContext(req.user.id);
    if (!canManageUsers(currentUser)) {
      return res.status(403).json({ message: 'Sem permissões para criar utilizadores.' });
    }

    const pool = await poolPromise;
    const divisionResult = await pool.request()
      .input('divisionId', sql.Int, divisionId)
      .query('SELECT id, code FROM Divisions WHERE id = @divisionId AND is_active = 1');
    const division = divisionResult.recordset[0];

    if (!division) {
      return res.status(400).json({ message: 'A divisão indicada não existe.' });
    }

    if (!canManageTargetUser(currentUser, division.code)) {
      return res.status(403).json({ message: 'Sem permissões para criar utilizadores nessa divisão.' });
    }

    const duplicate = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT TOP 1 id FROM Users WHERE email = @email');

    if (duplicate.recordset.length > 0) {
      return res.status(409).json({ message: 'Já existe um utilizador com esse email/identificador.' });
    }

    const passwordHash = await bcrypt.hash(password || 'Password123!', 10);
    const username = String(email).trim();

    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('display_name', sql.NVarChar, displayName)
      .input('email', sql.NVarChar, email)
      .input('password_hash', sql.NVarChar, passwordHash)
      .input('role', sql.NVarChar, role)
      .input('division_id', sql.Int, divisionId)
      .input('job_title', sql.NVarChar, jobTitle || null)
      .input('is_active', sql.Bit, isActive ? 1 : 0)
      .query(`
        INSERT INTO Users (username, display_name, email, password_hash, role, division_id, job_title, is_active)
        OUTPUT INSERTED.id
        VALUES (@username, @display_name, @email, @password_hash, @role, @division_id, @job_title, @is_active)
      `);

    await logAuditEvent({
      entityType: 'USER',
      entityId: result.recordset[0].id,
      action: 'CREATE',
      performedBy: req.user.id,
      details: `Utilizador ${email} criado com role ${role}`,
    });

    const created = await pool.request()
      .input('id', sql.Int, result.recordset[0].id)
      .query(`${baseUserSelect} WHERE u.id = @id`);

    res.status(201).json(created.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  const { displayName, email, role, divisionId, jobTitle, isActive } = req.body;

  const validationError = validateUserPayload({ displayName, email, role, divisionId });
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const currentUser = await getCurrentUserContext(req.user.id);
    const pool = await poolPromise;

    const target = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`${baseUserSelect} WHERE u.id = @id`);
    const targetUser = target.recordset[0];

    if (!targetUser) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    const divisionResult = await pool.request()
      .input('divisionId', sql.Int, divisionId)
      .query('SELECT id, code FROM Divisions WHERE id = @divisionId AND is_active = 1');
    const division = divisionResult.recordset[0];

    if (!division) {
      return res.status(400).json({ message: 'A divisão indicada não existe.' });
    }

    if (!canManageTargetUser(currentUser, targetUser.divisionCode) || !canManageTargetUser(currentUser, division.code)) {
      return res.status(403).json({ message: 'Sem permissões para editar este utilizador.' });
    }

    const duplicate = await pool.request()
      .input('email', sql.NVarChar, email)
      .input('id', sql.Int, req.params.id)
      .query('SELECT TOP 1 id FROM Users WHERE email = @email AND id <> @id');

    if (duplicate.recordset.length > 0) {
      return res.status(409).json({ message: 'Já existe um utilizador com esse email/identificador.' });
    }

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('username', sql.NVarChar, email)
      .input('display_name', sql.NVarChar, displayName)
      .input('email', sql.NVarChar, email)
      .input('role', sql.NVarChar, role)
      .input('division_id', sql.Int, divisionId)
      .input('job_title', sql.NVarChar, jobTitle || null)
      .input('is_active', sql.Bit, isActive ? 1 : 0)
      .query(`
        UPDATE Users
        SET username = @username,
            display_name = @display_name,
            email = @email,
            role = @role,
            division_id = @division_id,
            job_title = @job_title,
            is_active = @is_active,
            updated_at = GETUTCDATE()
        WHERE id = @id
      `);

    await logAuditEvent({
      entityType: 'USER',
      entityId: Number(req.params.id),
      action: 'UPDATE',
      performedBy: req.user.id,
      details: `Utilizador ${email} atualizado com role ${role}`,
    });

    const updated = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`${baseUserSelect} WHERE u.id = @id`);

    res.json(updated.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/status', authenticateToken, async (req, res) => {
  const { isActive } = req.body;

  try {
    const currentUser = await getCurrentUserContext(req.user.id);
    const pool = await poolPromise;
    const target = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`${baseUserSelect} WHERE u.id = @id`);
    const targetUser = target.recordset[0];

    if (!targetUser) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    if (!canManageTargetUser(currentUser, targetUser.divisionCode)) {
      return res.status(403).json({ message: 'Sem permissões para alterar o estado deste utilizador.' });
    }

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('is_active', sql.Bit, isActive ? 1 : 0)
      .query('UPDATE Users SET is_active = @is_active, updated_at = GETUTCDATE() WHERE id = @id');

    await logAuditEvent({
      entityType: 'USER',
      entityId: Number(req.params.id),
      action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
      performedBy: req.user.id,
      details: `Estado alterado para ${isActive ? 'ativo' : 'inativo'}`,
    });

    const updated = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`${baseUserSelect} WHERE u.id = @id`);

    res.json(updated.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getCurrentUserContext(req.user.id);
    const pool = await poolPromise;
    const target = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`${baseUserSelect} WHERE u.id = @id`);
    const targetUser = target.recordset[0];

    if (!targetUser) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    if (!canManageTargetUser(currentUser, targetUser.divisionCode)) {
      return res.status(403).json({ message: 'Sem permissões para remover este utilizador.' });
    }

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Users WHERE id = @id');

    await logAuditEvent({
      entityType: 'USER',
      entityId: Number(req.params.id),
      action: 'DELETE',
      performedBy: req.user.id,
      details: `Utilizador ${targetUser.email} removido`,
    });

    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
