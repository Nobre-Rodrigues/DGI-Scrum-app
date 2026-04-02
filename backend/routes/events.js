const express = require('express');
const { sql, poolPromise } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get events for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    // Get manual events
    const eventsResult = await pool.request()
      .input('projectId', sql.Int, req.params.projectId)
      .query('SELECT id, title, description, start_date as start, end_date as end, type FROM Events WHERE project_id = @projectId');

    // Get sprint events
    const sprintsResult = await pool.request()
      .input('projectId', sql.Int, req.params.projectId)
      .query('SELECT id, name as title, \'Sprint\' as type, start_date as start, end_date as end FROM Sprints WHERE project_id = @projectId');

    // Generate Scrum events based on sprints
    const scrumEvents = [];
    for (const sprint of sprintsResult.recordset) {
      const start = new Date(sprint.start);
      const end = new Date(sprint.end);
      // Sprint Planning: first day, 2 hours
      scrumEvents.push({
        id: `planning-${sprint.id}`,
        title: `Sprint Planning - ${sprint.title}`,
        start: start.toISOString(),
        end: new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        type: 'Sprint Planning'
      });
      // Daily Scrum: every day during sprint, 15 min
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        scrumEvents.push({
          id: `daily-${sprint.id}-${d.getDate()}`,
          title: 'Daily Scrum',
          start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0).toISOString(), // 9 AM
          end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 15).toISOString(),
          type: 'Daily Scrum'
        });
      }
      // Sprint Review: last day, 1 hour
      scrumEvents.push({
        id: `review-${sprint.id}`,
        title: `Sprint Review - ${sprint.title}`,
        start: new Date(end.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        end: end.toISOString(),
        type: 'Sprint Review'
      });
      // Sprint Retrospective: after review, 45 min
      scrumEvents.push({
        id: `retro-${sprint.id}`,
        title: `Sprint Retrospective - ${sprint.title}`,
        start: end.toISOString(),
        end: new Date(end.getTime() + 45 * 60 * 1000).toISOString(),
        type: 'Sprint Retrospective'
      });
    }

    const allEvents = [...eventsResult.recordset, ...sprintsResult.recordset.map(s => ({ ...s, id: `sprint-${s.id}` })), ...scrumEvents];
    res.json(allEvents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create custom event
router.post('/', authenticateToken, async (req, res) => {
  const { project_id, title, description, start_date, end_date, type } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('project_id', sql.Int, project_id)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('start_date', sql.DateTime2, start_date)
      .input('end_date', sql.DateTime2, end_date)
      .input('type', sql.NVarChar, type)
      .query('INSERT INTO Events (project_id, title, description, start_date, end_date, type) OUTPUT INSERTED.* VALUES (@project_id, @title, @description, @start_date, @end_date, @type)');
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;