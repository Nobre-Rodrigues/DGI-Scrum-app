const { sql, poolPromise } = require('../config/db');
const {
  calculatePercentage,
  calculateProgressDelta,
  getTrendStatus,
  getLoadStatus,
} = require('../utils/projectMetrics');
const { WORK_TYPES, PRIORITIES } = require('../constants/projectMetadata');

const doneStatuses = ['Done', 'Concluído', 'Concluido', 'completed'];
const legacyPriorityMap = {
  Must: 'Alta',
  Should: 'Média',
  Could: 'Baixa',
  "Won't": 'Baixa',
};

const isDoneStatus = (status) => doneStatuses.includes(status);
const normalizePriority = (priority) => legacyPriorityMap[priority] || priority || 'Média';

const getProjectDashboardSummary = async (projectId) => {
  const pool = await poolPromise;

  const [projectResult, backlogResult, taskResult, workItemResult, updateResult, capacitySettingsResult] = await Promise.all([
    pool.request()
      .input('projectId', sql.Int, projectId)
      .query('SELECT * FROM Projects WHERE id = @projectId'),
    pool.request()
      .input('projectId', sql.Int, projectId)
      .query('SELECT * FROM BacklogItems WHERE project_id = @projectId'),
    pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT t.*, u.username AS assignee_name, b.project_id
        FROM Tasks t
        JOIN BacklogItems b ON b.id = t.backlog_item_id
        LEFT JOIN Users u ON u.id = t.assigned_to
        WHERE b.project_id = @projectId
      `),
    pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT w.*, u.username AS assignee_name, b.title AS backlog_title
        FROM WorkItems w
        LEFT JOIN Users u ON u.id = w.assignee_id
        LEFT JOIN BacklogItems b ON b.id = w.backlog_item_id
        WHERE w.project_id = @projectId AND w.archived = 0
      `),
    pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT pu.*, u.username AS changed_by_name
        FROM ProjectUpdates pu
        LEFT JOIN Users u ON u.id = pu.changed_by
        WHERE pu.project_id = @projectId
        ORDER BY pu.changed_at DESC
      `),
    pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT pcs.*, u.username, u.role
        FROM ProjectCapacitySettings pcs
        JOIN Users u ON u.id = pcs.user_id
        WHERE pcs.project_id = @projectId
      `),
  ]);

  if (projectResult.recordset.length === 0) {
    return null;
  }

  const project = projectResult.recordset[0];
  const backlogItems = backlogResult.recordset;
  const tasks = taskResult.recordset;
  const workItems = workItemResult.recordset;
  const persistedUpdates = updateResult.recordset;
  const capacitySettings = capacitySettingsResult.recordset;

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const nextSevenDays = new Date(now);
  nextSevenDays.setDate(now.getDate() + 7);

  const allUnits = [
    ...backlogItems.map((item) => ({ ...item, entityType: 'BacklogItem' })),
    ...tasks.map((item) => ({ ...item, entityType: 'Task' })),
    ...workItems.map((item) => ({ ...item, entityType: 'WorkItem' })),
  ];

  const currentCompleted = allUnits.filter((item) => isDoneStatus(item.status)).length;
  const currentPercentage = calculatePercentage(currentCompleted, allUnits.length);

  const previousUnits = allUnits.filter((item) => new Date(item.created_at) <= sevenDaysAgo);
  const previousCompleted = previousUnits.filter((item) => {
    if (!isDoneStatus(item.status)) {
      return false;
    }

    const updatedAt = item.updated_at ? new Date(item.updated_at) : new Date(item.created_at);
    return updatedAt <= sevenDaysAgo;
  }).length;
  const previousPercentage = calculatePercentage(previousCompleted, previousUnits.length);
  const delta = calculateProgressDelta(currentPercentage, previousPercentage);

  const derivedUpdates = [
    ...backlogItems
      .filter((item) => item.updated_at && new Date(item.updated_at) >= sevenDaysAgo)
      .map((item) => ({
        id: `backlog-${item.id}-${item.updated_at}`,
        entity_type: 'BacklogItem',
        entity_id: item.id,
        change_type: 'updated',
        changed_at: item.updated_at,
        changed_by_name: null,
        description: `Backlog item "${item.title}" foi atualizado.`,
      })),
    ...tasks
      .filter((item) => item.updated_at && new Date(item.updated_at) >= sevenDaysAgo)
      .map((item) => ({
        id: `task-${item.id}-${item.updated_at}`,
        entity_type: 'Task',
        entity_id: item.id,
        change_type: 'updated',
        changed_at: item.updated_at,
        changed_by_name: item.assignee_name || null,
        description: `Tarefa "${item.title}" foi atualizada.`,
      })),
    ...workItems
      .filter((item) => item.updated_at && new Date(item.updated_at) >= sevenDaysAgo)
      .map((item) => ({
        id: `work-item-${item.id}-${item.updated_at}`,
        entity_type: 'WorkItem',
        entity_id: item.id,
        change_type: 'updated',
        changed_at: item.updated_at,
        changed_by_name: item.assignee_name || null,
        description: `Item de trabalho "${item.title}" foi atualizado.`,
      })),
  ];

  const recentUpdates = [...persistedUpdates, ...derivedUpdates]
    .filter((item) => new Date(item.changed_at) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));

  const recentTasks = tasks
    .filter((task) => new Date(task.created_at) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const plannedItems = [
    ...tasks.map((task) => ({ ...task, entityType: 'Task', owner_name: task.assignee_name || 'Sem responsável' })),
    ...workItems.map((item) => ({ ...item, entityType: 'WorkItem', owner_name: item.assignee_name || 'Sem responsável' })),
  ].filter((item) => {
    const plannedStart = item.planned_start_date ? new Date(item.planned_start_date) : null;
    const plannedEnd = item.planned_end_date ? new Date(item.planned_end_date) : null;

    return (
      (plannedStart && plannedStart >= now && plannedStart <= nextSevenDays) ||
      (plannedEnd && plannedEnd >= now && plannedEnd <= nextSevenDays)
    );
  }).sort((a, b) => {
    const firstDate = new Date(a.planned_start_date || a.planned_end_date || a.created_at);
    const secondDate = new Date(b.planned_start_date || b.planned_end_date || b.created_at);
    return firstDate - secondDate;
  });

  const prioritySource = [
    ...backlogItems.map((item) => ({ id: item.id, title: item.title, priority: normalizePriority(item.priority), entityType: 'backlog' })),
    ...workItems.map((item) => ({ id: item.id, title: item.title, priority: normalizePriority(item.priority), entityType: 'work-item' })),
  ];

  const priorityBreakdown = PRIORITIES.map((priority) => ({
    priority,
    count: prioritySource.filter((item) => item.priority === priority).length,
  }));

  const workTypeBreakdown = WORK_TYPES.map((workType) => ({
    workType,
    count: workItems.filter((item) => item.work_type === workType).length + tasks.filter((item) => item.work_type === workType).length,
  }));

  const assignments = new Map();

  const addAssignment = (userId, username, role, estimatedHours) => {
    if (!userId) {
      return;
    }

    const existing = assignments.get(userId) || {
      userId,
      name: username || 'Sem nome',
      role: role || 'Membro da equipa',
      assignedEstimatedHours: 0,
    };

    existing.assignedEstimatedHours += Number(estimatedHours || 0);
    assignments.set(userId, existing);
  };

  tasks.forEach((task) => addAssignment(task.assigned_to, task.assignee_name, null, task.estimated_hours));
  workItems.forEach((item) => addAssignment(item.assignee_id, item.assignee_name, null, item.estimated_hours));

  const teamCapacity = Array.from(assignments.values()).map((member) => {
    const persistedSetting = capacitySettings.find((setting) => setting.user_id === member.userId);
    const weeklyCapacityHours = Number(persistedSetting?.weekly_capacity_hours || 40);
    const occupationPercentage = weeklyCapacityHours
      ? Math.round((member.assignedEstimatedHours / weeklyCapacityHours) * 100)
      : 0;

    return {
      id: `${projectId}-${member.userId}`,
      projectId,
      userId: member.userId,
      name: member.name,
      role: persistedSetting?.role || member.role || 'Membro da equipa',
      weeklyCapacityHours,
      assignedEstimatedHours: Number(member.assignedEstimatedHours || 0),
      occupationPercentage,
      loadStatus: getLoadStatus(occupationPercentage),
    };
  }).sort((a, b) => b.occupationPercentage - a.occupationPercentage);

  return {
    project: {
      ...project,
      progressPercentage: currentPercentage,
    },
    metrics: {
      progressLast7Days: {
        currentPercentage,
        previousPercentage,
        delta,
        trend: getTrendStatus(delta),
      },
      updatesLast7Days: {
        count: recentUpdates.length,
        items: recentUpdates.slice(0, 10),
      },
      tasksCreatedLast7Days: {
        count: recentTasks.length,
        items: recentTasks.slice(0, 10),
      },
      plannedNext7Days: {
        count: plannedItems.length,
        items: plannedItems.slice(0, 10),
      },
    },
    state: {
      status: project.status || 'Não iniciado',
      totalWorkItems: allUnits.length,
      completedWorkItems: currentCompleted,
    },
    workItems: {
      count: workItems.length,
      items: workItems,
    },
    priorities: {
      breakdown: priorityBreakdown,
      items: prioritySource,
    },
    workTypes: {
      breakdown: workTypeBreakdown,
      availableTypes: WORK_TYPES,
    },
    teamCapacity,
  };
};

module.exports = {
  getProjectDashboardSummary,
};
