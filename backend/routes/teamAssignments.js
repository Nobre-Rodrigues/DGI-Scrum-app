const express = require('express');
const { sql, poolPromise } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const {
  canApproveParticipation,
  canNominateUser,
  canManageAllDivisions,
  getAssignmentDecision,
  getManagedDivisionCode,
  isAssignmentContextValid,
  isRoleValid,
} = require('../services/authorizationService');
const { logAuditEvent } = require('../services/auditLogService');

const router = express.Router();

const assignmentSelect = `
  SELECT
    ta.id,
    ta.context_type AS contextType,
    ta.context_id AS contextId,
    ta.user_id AS userId,
    ta.assigned_role AS assignedRole,
    ta.division_id AS divisionId,
    d.name AS divisionName,
    d.code AS divisionCode,
    ta.requested_by_user_id AS requestedByUserId,
    requester.display_name AS requestedByName,
    requester.email AS requestedByEmail,
    ta.requested_by_division_id AS requestedByDivisionId,
    requesterDivision.name AS requestedByDivisionName,
    requesterDivision.code AS requestedByDivisionCode,
    ta.approval_status AS approvalStatus,
    ta.approval_required AS approvalRequired,
    ta.approved_by_user_id AS approvedByUserId,
    approver.display_name AS approvedByName,
    ta.approved_at AS approvedAt,
    ta.rejected_by_user_id AS rejectedByUserId,
    rejector.display_name AS rejectedByName,
    ta.rejected_at AS rejectedAt,
    ta.rejection_reason AS rejectionReason,
    ta.notes,
    ta.is_cancelled AS isCancelled,
    ta.created_at AS createdAt,
    ta.updated_at AS updatedAt,
    target.display_name AS userDisplayName,
    target.email AS userEmail,
    p.name AS projectName
  FROM TeamAssignments ta
  INNER JOIN Users target ON target.id = ta.user_id
  INNER JOIN Divisions d ON d.id = ta.division_id
  INNER JOIN Users requester ON requester.id = ta.requested_by_user_id
  LEFT JOIN Divisions requesterDivision ON requesterDivision.id = ta.requested_by_division_id
  LEFT JOIN Users approver ON approver.id = ta.approved_by_user_id
  LEFT JOIN Users rejector ON rejector.id = ta.rejected_by_user_id
  LEFT JOIN Projects p ON p.id = ta.context_id AND ta.context_type = 'PROJECT'
`;

const getCurrentUserContext = async (userId) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('id', sql.Int, userId)
    .query(`
      SELECT TOP 1
        u.id,
        u.role,
        u.display_name AS displayName,
        u.email,
        d.id AS divisionId,
        d.code AS divisionCode,
        d.name AS divisionName
      FROM Users u
      LEFT JOIN Divisions d ON d.id = u.division_id
      WHERE u.id = @id
    `);
  return result.recordset[0] || null;
};

const getTargetUser = async (userId) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('id', sql.Int, userId)
    .query(`
      SELECT TOP 1
        u.id,
        u.display_name AS displayName,
        u.email,
        u.is_active AS isActive,
        d.id AS divisionId,
        d.code AS divisionCode,
        d.name AS divisionName
      FROM Users u
      LEFT JOIN Divisions d ON d.id = u.division_id
      WHERE u.id = @id
    `);
  return result.recordset[0] || null;
};

const validateContext = async (contextType, contextId) => {
  const normalizedContext = String(contextType || '').toUpperCase();

  if (!isAssignmentContextValid(normalizedContext)) {
    return { error: 'O contexto indicado não é válido.' };
  }

  if (normalizedContext === 'PROJECT') {
    if (!contextId) {
      return { error: 'O projeto é obrigatório para nomeações em contexto de projeto.' };
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, contextId)
      .query('SELECT TOP 1 id, name FROM Projects WHERE id = @id');

    if (result.recordset.length === 0) {
      return { error: 'O projeto indicado não existe.' };
    }
  }

  return { contextType: normalizedContext };
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getCurrentUserContext(req.user.id);
    const pool = await poolPromise;
    const request = pool.request()
      .input('userId', sql.Int, currentUser.id)
      .input('divisionCode', sql.NVarChar, currentUser.divisionCode || '');

    let query = assignmentSelect;

    if (canManageAllDivisions(currentUser)) {
      query += ' WHERE 1 = 1';
    } else if (getManagedDivisionCode(currentUser.role)) {
      query += `
        WHERE ta.requested_by_user_id = @userId
           OR target.id = @userId
           OR d.code = @divisionCode
      `;
    } else {
      query += ' WHERE target.id = @userId';
    }

    if (req.query.contextType) {
      request.input('contextType', sql.NVarChar, String(req.query.contextType).toUpperCase());
      query += ' AND ta.context_type = @contextType';
    }

    if (req.query.contextId) {
      request.input('contextId', sql.Int, Number(req.query.contextId));
      query += ' AND ta.context_id = @contextId';
    }

    query += ' ORDER BY ta.created_at DESC';
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getCurrentUserContext(req.user.id);
    const pool = await poolPromise;
    const request = pool.request()
      .input('divisionCode', sql.NVarChar, currentUser.divisionCode || '');

    let query = `${assignmentSelect} WHERE ta.approval_status = 'PENDING' AND ta.is_cancelled = 0`;

    if (!canManageAllDivisions(currentUser)) {
      const managedDivisionCode = getManagedDivisionCode(currentUser.role);
      if (!managedDivisionCode) {
        return res.json([]);
      }

      query += ' AND d.code = @divisionCode';
    }

    query += ' ORDER BY ta.created_at DESC';
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { contextType, contextId, userId, assignedRole, notes } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'O utilizador é obrigatório.' });
  }

  if (!String(assignedRole || '').trim() || !isRoleValid(assignedRole)) {
    return res.status(400).json({ message: 'A função atribuída no contexto tem de ser válida.' });
  }

  try {
    const currentUser = await getCurrentUserContext(req.user.id);
    if (!canNominateUser(currentUser)) {
      return res.status(403).json({ message: 'Sem permissões para nomear utilizadores.' });
    }

    const contextValidation = await validateContext(contextType, contextId);
    if (contextValidation.error) {
      return res.status(400).json({ message: contextValidation.error });
    }

    const targetUser = await getTargetUser(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'O utilizador indicado não existe.' });
    }

    if (!targetUser.isActive) {
      return res.status(400).json({ message: 'Não é possível nomear um utilizador inativo.' });
    }

    const pool = await poolPromise;
    const duplicate = await pool.request()
      .input('context_type', sql.NVarChar, contextValidation.contextType)
      .input('context_id', sql.Int, contextId || null)
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT TOP 1 id
        FROM TeamAssignments
        WHERE context_type = @context_type
          AND ISNULL(context_id, 0) = ISNULL(@context_id, 0)
          AND user_id = @user_id
          AND is_cancelled = 0
          AND approval_status IN ('APPROVED', 'PENDING')
      `);

    if (duplicate.recordset.length > 0) {
      return res.status(409).json({ message: 'Já existe uma nomeação ativa ou pendente para esse utilizador no mesmo contexto.' });
    }

    const decision = getAssignmentDecision({
      actor: currentUser,
      actorDivisionCode: currentUser.divisionCode,
      targetDivisionCode: targetUser.divisionCode,
    });

    const result = await pool.request()
      .input('context_type', sql.NVarChar, contextValidation.contextType)
      .input('context_id', sql.Int, contextId || null)
      .input('user_id', sql.Int, userId)
      .input('assigned_role', sql.NVarChar, assignedRole)
      .input('division_id', sql.Int, targetUser.divisionId)
      .input('requested_by_user_id', sql.Int, currentUser.id)
      .input('requested_by_division_id', sql.Int, currentUser.divisionId || null)
      .input('approval_status', sql.NVarChar, decision.approvalStatus)
      .input('approval_required', sql.Bit, decision.approvalRequired ? 1 : 0)
      .input('approved_by_user_id', sql.Int, decision.approvalRequired ? null : currentUser.id)
      .input('approved_at', sql.DateTime2, decision.approvalRequired ? null : new Date())
      .input('notes', sql.NVarChar, notes || null)
      .query(`
        INSERT INTO TeamAssignments (
          context_type,
          context_id,
          user_id,
          assigned_role,
          division_id,
          requested_by_user_id,
          requested_by_division_id,
          approval_status,
          approval_required,
          approved_by_user_id,
          approved_at,
          notes
        )
        OUTPUT INSERTED.id
        VALUES (
          @context_type,
          @context_id,
          @user_id,
          @assigned_role,
          @division_id,
          @requested_by_user_id,
          @requested_by_division_id,
          @approval_status,
          @approval_required,
          @approved_by_user_id,
          @approved_at,
          @notes
        )
      `);

    await logAuditEvent({
      entityType: 'TEAM_ASSIGNMENT',
      entityId: result.recordset[0].id,
      action: 'CREATE',
      performedBy: currentUser.id,
      details: `Nomeação ${decision.approvalStatus} para ${targetUser.email} em ${contextValidation.contextType}`,
    });

    const created = await pool.request()
      .input('id', sql.Int, result.recordset[0].id)
      .query(`${assignmentSelect} WHERE ta.id = @id`);

    res.status(201).json(created.recordset[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getCurrentUserContext(req.user.id);
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`${assignmentSelect} WHERE ta.id = @id`);
    const assignment = result.recordset[0];

    if (!assignment) {
      return res.status(404).json({ message: 'Nomeação não encontrada.' });
    }

    if (!canApproveParticipation({ actor: currentUser, assignmentTargetDivisionCode: assignment.divisionCode })) {
      return res.status(403).json({ message: 'Sem permissões para aprovar esta nomeação.' });
    }

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('approved_by_user_id', sql.Int, currentUser.id)
      .input('approved_at', sql.DateTime2, new Date())
      .query(`
        UPDATE TeamAssignments
        SET approval_status = 'APPROVED',
            approval_required = 0,
            approved_by_user_id = @approved_by_user_id,
            approved_at = @approved_at,
            rejected_by_user_id = NULL,
            rejected_at = NULL,
            rejection_reason = NULL,
            updated_at = GETUTCDATE()
        WHERE id = @id
      `);

    await logAuditEvent({
      entityType: 'TEAM_ASSIGNMENT',
      entityId: Number(req.params.id),
      action: 'APPROVE',
      performedBy: currentUser.id,
      details: `Nomeação aprovada para ${assignment.userEmail}`,
    });

    const updated = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`${assignmentSelect} WHERE ta.id = @id`);

    res.json(updated.recordset[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/reject', authenticateToken, async (req, res) => {
  const { rejectionReason } = req.body;

  if (!String(rejectionReason || '').trim()) {
    return res.status(400).json({ message: 'O motivo de rejeição é obrigatório.' });
  }

  try {
    const currentUser = await getCurrentUserContext(req.user.id);
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`${assignmentSelect} WHERE ta.id = @id`);
    const assignment = result.recordset[0];

    if (!assignment) {
      return res.status(404).json({ message: 'Nomeação não encontrada.' });
    }

    if (!canApproveParticipation({ actor: currentUser, assignmentTargetDivisionCode: assignment.divisionCode })) {
      return res.status(403).json({ message: 'Sem permissões para rejeitar esta nomeação.' });
    }

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('rejected_by_user_id', sql.Int, currentUser.id)
      .input('rejected_at', sql.DateTime2, new Date())
      .input('rejection_reason', sql.NVarChar, rejectionReason)
      .query(`
        UPDATE TeamAssignments
        SET approval_status = 'REJECTED',
            rejected_by_user_id = @rejected_by_user_id,
            rejected_at = @rejected_at,
            rejection_reason = @rejection_reason,
            approved_by_user_id = NULL,
            approved_at = NULL,
            updated_at = GETUTCDATE()
        WHERE id = @id
      `);

    await logAuditEvent({
      entityType: 'TEAM_ASSIGNMENT',
      entityId: Number(req.params.id),
      action: 'REJECT',
      performedBy: currentUser.id,
      details: `Nomeação rejeitada para ${assignment.userEmail}`,
    });

    const updated = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`${assignmentSelect} WHERE ta.id = @id`);

    res.json(updated.recordset[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getCurrentUserContext(req.user.id);
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`${assignmentSelect} WHERE ta.id = @id`);
    const assignment = result.recordset[0];

    if (!assignment) {
      return res.status(404).json({ message: 'Nomeação não encontrada.' });
    }

    if (assignment.requestedByUserId !== currentUser.id && !canManageAllDivisions(currentUser)) {
      return res.status(403).json({ message: 'Sem permissões para cancelar esta nomeação.' });
    }

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        UPDATE TeamAssignments
        SET approval_status = 'CANCELLED',
            is_cancelled = 1,
            updated_at = GETUTCDATE()
        WHERE id = @id
      `);

    await logAuditEvent({
      entityType: 'TEAM_ASSIGNMENT',
      entityId: Number(req.params.id),
      action: 'CANCEL',
      performedBy: currentUser.id,
      details: `Nomeação cancelada para ${assignment.userEmail}`,
    });

    const updated = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`${assignmentSelect} WHERE ta.id = @id`);

    res.json(updated.recordset[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
