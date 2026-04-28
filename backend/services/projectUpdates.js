const { sql } = require('../config/db');

const logProjectUpdate = async ({
  pool,
  projectId,
  entityType,
  entityId,
  changeType,
  changedBy,
  description,
}) => {
  await pool.request()
    .input('project_id', sql.Int, projectId)
    .input('entity_type', sql.NVarChar, entityType)
    .input('entity_id', sql.Int, entityId || null)
    .input('change_type', sql.NVarChar, changeType)
    .input('changed_by', sql.Int, changedBy || null)
    .input('description', sql.NVarChar, description)
    .query(`
      INSERT INTO ProjectUpdates (project_id, entity_type, entity_id, change_type, changed_by, description)
      VALUES (@project_id, @entity_type, @entity_id, @change_type, @changed_by, @description)
    `);
};

module.exports = {
  logProjectUpdate,
};

