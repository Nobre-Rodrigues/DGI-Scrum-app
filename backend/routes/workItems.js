const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { poolPromise, sql } = require('../config/db');
const { PRIORITIES, WORK_TYPES, WORK_ITEM_STATUSES } = require('../constants/projectMetadata');
const { logProjectUpdate } = require('../services/projectUpdates');

const router = express.Router();

router.get('/types', authenticateToken, async (req, res) => {
  res.json({ workTypes: WORK_TYPES, priorities: PRIORITIES, statuses: WORK_ITEM_STATUSES });
});

router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('projectId', sql.Int, req.params.projectId)
      .query(`
        SELECT w.*, u.username AS assignee_name, b.title AS backlog_title
        FROM WorkItems w
        LEFT JOIN Users u ON u.id = w.assignee_id
        LEFT JOIN BacklogItems b ON b.id = w.backlog_item_id
        WHERE w.project_id = @projectId AND w.archived = 0
        ORDER BY w.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authenticateToken, [
  body('project_id').isInt(),
  body('title').isLength({ min: 3 }),
  body('priority').isIn(PRIORITIES),
  body('work_type').isIn(WORK_TYPES),
  body('status').optional().isIn(WORK_ITEM_STATUSES),
  body('tasks').optional().isArray(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    project_id,
    backlog_item_id,
    title,
    description,
    assignee_id,
    status,
    priority,
    work_type,
    estimated_hours,
    planned_start_date,
    planned_end_date,
    done_criterion,
    tasks = [],
  } = req.body;

  try {
    const invalidTask = tasks.find((task) => !String(task?.title || '').trim());

    if (invalidTask) {
      return res.status(400).json({ message: 'Cada tarefa do pacote precisa de um título.' });
    }

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request = new sql.Request(transaction);
      const result = await request
        .input('project_id', sql.Int, project_id)
        .input('backlog_item_id', sql.Int, backlog_item_id || null)
        .input('title', sql.NVarChar, title)
        .input('description', sql.NVarChar, description || null)
        .input('assignee_id', sql.Int, assignee_id || null)
        .input('status', sql.NVarChar, status || 'Não iniciado')
        .input('priority', sql.NVarChar, priority)
        .input('work_type', sql.NVarChar, work_type)
        .input('estimated_hours', sql.Decimal(10, 2), estimated_hours || null)
        .input('planned_start_date', sql.Date, planned_start_date || null)
        .input('planned_end_date', sql.Date, planned_end_date || null)
        .input('done_criterion', sql.NVarChar, done_criterion || null)
        .query(`
          INSERT INTO WorkItems (
            project_id, backlog_item_id, title, description, assignee_id, status, priority, work_type,
            estimated_hours, planned_start_date, planned_end_date, done_criterion
          )
          OUTPUT INSERTED.*
          VALUES (
            @project_id, @backlog_item_id, @title, @description, @assignee_id, @status, @priority, @work_type,
            @estimated_hours, @planned_start_date, @planned_end_date, @done_criterion
          )
        `);

      const createdWorkItem = result.recordset[0];

      for (let index = 0; index < tasks.length; index += 1) {
        const task = tasks[index];
        const taskRequest = new sql.Request(transaction);

        await taskRequest
          .input('backlog_item_id', sql.Int, backlog_item_id || null)
          .input('title', sql.NVarChar, String(task.title).trim())
          .input('description', sql.NVarChar, task.description || null)
          .input('assigned_to', sql.Int, task.assigned_to || assignee_id || null)
          .input('priority', sql.NVarChar, task.priority || priority || 'Média')
          .input('estimated_hours', sql.Decimal(10, 2), task.estimated_hours || null)
          .input('planned_start_date', sql.Date, task.planned_start_date || planned_start_date || null)
          .input('planned_end_date', sql.Date, task.planned_end_date || planned_end_date || null)
          .input('work_type', sql.NVarChar, task.work_type || work_type || null)
          .input('work_item_id', sql.Int, createdWorkItem.id)
          .input('sort_order', sql.Int, index + 1)
          .query(`
            INSERT INTO Tasks (
              backlog_item_id, title, description, assigned_to, priority, estimated_hours,
              planned_start_date, planned_end_date, work_type, work_item_id, sort_order
            )
            VALUES (
              @backlog_item_id, @title, @description, @assigned_to, @priority, @estimated_hours,
              @planned_start_date, @planned_end_date, @work_type, @work_item_id, @sort_order
            )
          `);
      }

      await transaction.commit();

      await logProjectUpdate({
        pool,
        projectId: project_id,
        entityType: 'WorkItem',
        entityId: createdWorkItem.id,
        changeType: 'created',
        changedBy: req.user.id,
        description: `Item de trabalho "${title}" foi criado${tasks.length ? ` com ${tasks.length} tarefa(s).` : '.'}`,
      });

      res.status(201).json(createdWorkItem);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', authenticateToken, [
  body('title').isLength({ min: 3 }),
  body('priority').isIn(PRIORITIES),
  body('work_type').isIn(WORK_TYPES),
  body('status').isIn(WORK_ITEM_STATUSES),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    backlog_item_id,
    title,
    description,
    assignee_id,
    status,
    priority,
    work_type,
    estimated_hours,
    planned_start_date,
    planned_end_date,
    done_criterion,
  } = req.body;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('backlog_item_id', sql.Int, backlog_item_id || null)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description || null)
      .input('assignee_id', sql.Int, assignee_id || null)
      .input('status', sql.NVarChar, status)
      .input('priority', sql.NVarChar, priority)
      .input('work_type', sql.NVarChar, work_type)
      .input('estimated_hours', sql.Decimal(10, 2), estimated_hours || null)
      .input('planned_start_date', sql.Date, planned_start_date || null)
      .input('planned_end_date', sql.Date, planned_end_date || null)
      .input('done_criterion', sql.NVarChar, done_criterion || null)
      .query(`
        UPDATE WorkItems
        SET backlog_item_id = @backlog_item_id,
            title = @title,
            description = @description,
            assignee_id = @assignee_id,
            status = @status,
            priority = @priority,
            work_type = @work_type,
            estimated_hours = @estimated_hours,
            planned_start_date = @planned_start_date,
            planned_end_date = @planned_end_date,
            done_criterion = @done_criterion,
            updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Work item not found' });
    }

    await logProjectUpdate({
      pool,
      projectId: result.recordset[0].project_id,
      entityType: 'WorkItem',
      entityId: Number(req.params.id),
      changeType: 'updated',
      changedBy: req.user.id,
      description: `Item de trabalho "${title}" foi atualizado.`,
    });

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', authenticateToken, authorizeRoles('Product Owner', 'Scrum Master', 'Director'), async (req, res) => {
  try {
    const pool = await poolPromise;
    const existing = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM WorkItems WHERE id = @id');

    if (existing.recordset.length === 0) {
      return res.status(404).json({ message: 'Work item not found' });
    }

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM WorkItems WHERE id = @id');

    await logProjectUpdate({
      pool,
      projectId: existing.recordset[0].project_id,
      entityType: 'WorkItem',
      entityId: Number(req.params.id),
      changeType: 'deleted',
      changedBy: req.user.id,
      description: `Item de trabalho "${existing.recordset[0].title}" foi removido.`,
    });

    res.json({ message: 'Work item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/archive', authenticateToken, authorizeRoles('Product Owner', 'Scrum Master', 'Director'), async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        UPDATE WorkItems
        SET archived = 1, updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Work item not found' });
    }

    await logProjectUpdate({
      pool,
      projectId: result.recordset[0].project_id,
      entityType: 'WorkItem',
      entityId: Number(req.params.id),
      changeType: 'archived',
      changedBy: req.user.id,
      description: `Item de trabalho "${result.recordset[0].title}" foi arquivado.`,
    });

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
