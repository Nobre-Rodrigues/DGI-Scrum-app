const express = require('express');
const { sql, poolPromise } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get dashboard data for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const projectId = req.params.projectId;

    // Burndown data (simplified)
    const burndownResult = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT s.id, s.name, s.start_date, s.end_date,
               SUM(b.story_points) as total_points,
               SUM(CASE WHEN b.status = 'Done' THEN b.story_points ELSE 0 END) as done_points
        FROM Sprints s
        LEFT JOIN BacklogItems b ON s.project_id = b.project_id
        WHERE s.project_id = @projectId AND b.status = 'Committed'
        GROUP BY s.id, s.name, s.start_date, s.end_date
      `);

    // Velocity
    const velocityResult = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT s.name, SUM(b.story_points) as velocity
        FROM Sprints s
        LEFT JOIN BacklogItems b ON s.project_id = b.project_id
        WHERE s.project_id = @projectId AND s.status = 'completed' AND b.status = 'Done'
        GROUP BY s.id, s.name
      `);

    // Workload per member
    const workloadResult = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT u.username, COUNT(t.id) as task_count
        FROM Users u
        LEFT JOIN Tasks t ON u.id = t.assigned_to
        LEFT JOIN BacklogItems b ON t.backlog_item_id = b.id
        WHERE b.project_id = @projectId
        GROUP BY u.id, u.username
      `);

    res.json({
      burndown: burndownResult.recordset,
      velocity: velocityResult.recordset,
      workload: workloadResult.recordset,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;