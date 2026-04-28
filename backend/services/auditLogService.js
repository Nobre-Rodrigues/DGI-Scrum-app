const { sql, poolPromise } = require('../config/db');

const logAuditEvent = async ({ entityType, entityId = null, action, performedBy = null, details }) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('entity_type', sql.NVarChar, entityType)
      .input('entity_id', sql.Int, entityId)
      .input('action', sql.NVarChar, action)
      .input('performed_by', sql.Int, performedBy)
      .input('details', sql.NVarChar, details)
      .query(`
        INSERT INTO AuditLogs (entity_type, entity_id, action, performed_by, details)
        VALUES (@entity_type, @entity_id, @action, @performed_by, @details)
      `);
  } catch (error) {
    console.error('Audit log failure', error.message);
  }
};

module.exports = {
  logAuditEvent,
};
