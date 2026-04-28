const { poolPromise } = require('./db');
const { DIVISIONS, ROLES } = require('../constants/team');

const schemaStatements = [
  `
  IF OBJECT_ID('Divisions', 'U') IS NULL
  BEGIN
    CREATE TABLE Divisions (
      id INT IDENTITY(1,1) PRIMARY KEY,
      name NVARCHAR(255) NOT NULL,
      code NVARCHAR(50) NOT NULL UNIQUE,
      is_active BIT NOT NULL CONSTRAINT DF_Divisions_is_active DEFAULT 1,
      created_at DATETIME2 NOT NULL CONSTRAINT DF_Divisions_created_at DEFAULT GETUTCDATE(),
      updated_at DATETIME2 NOT NULL CONSTRAINT DF_Divisions_updated_at DEFAULT GETUTCDATE()
    );
  END
  `,
  `
  IF OBJECT_ID('Roles', 'U') IS NULL
  BEGIN
    CREATE TABLE Roles (
      id INT IDENTITY(1,1) PRIMARY KEY,
      name NVARCHAR(255) NOT NULL UNIQUE,
      code NVARCHAR(50) NOT NULL UNIQUE,
      is_active BIT NOT NULL CONSTRAINT DF_Roles_is_active DEFAULT 1,
      created_at DATETIME2 NOT NULL CONSTRAINT DF_Roles_created_at DEFAULT GETUTCDATE(),
      updated_at DATETIME2 NOT NULL CONSTRAINT DF_Roles_updated_at DEFAULT GETUTCDATE()
    );
  END
  `,
  `
  IF COL_LENGTH('Projects', 'start_date') IS NULL
    ALTER TABLE Projects ADD start_date DATE NULL;
  IF COL_LENGTH('Projects', 'end_date') IS NULL
    ALTER TABLE Projects ADD end_date DATE NULL;
  IF COL_LENGTH('Projects', 'status') IS NULL
    ALTER TABLE Projects ADD status NVARCHAR(50) NOT NULL CONSTRAINT DF_Projects_status DEFAULT 'Não iniciado';
  IF COL_LENGTH('Projects', 'progress_percentage') IS NULL
    ALTER TABLE Projects ADD progress_percentage DECIMAL(5,2) NULL;
  IF COL_LENGTH('Projects', 'updated_at') IS NULL
    ALTER TABLE Projects ADD updated_at DATETIME2 NOT NULL CONSTRAINT DF_Projects_updated_at DEFAULT GETDATE();
  `,
  `
  IF COL_LENGTH('BacklogItems', 'definition_of_done') IS NULL
    ALTER TABLE BacklogItems ADD definition_of_done NVARCHAR(MAX) NULL;
  IF COL_LENGTH('BacklogItems', 'sprint_id') IS NULL
    ALTER TABLE BacklogItems ADD sprint_id INT NULL;
  `,
  `
  IF COL_LENGTH('Sprints', 'status') IS NULL
    ALTER TABLE Sprints ADD status NVARCHAR(30) NOT NULL CONSTRAINT DF_Sprints_status DEFAULT 'planned';
  `,
  `
  IF COL_LENGTH('Users', 'display_name') IS NULL
    ALTER TABLE Users ADD display_name NVARCHAR(255) NULL;
  IF COL_LENGTH('Users', 'job_title') IS NULL
    ALTER TABLE Users ADD job_title NVARCHAR(255) NULL;
  IF COL_LENGTH('Users', 'division_id') IS NULL
    ALTER TABLE Users ADD division_id INT NULL;
  IF COL_LENGTH('Users', 'is_active') IS NULL
    ALTER TABLE Users ADD is_active BIT NOT NULL CONSTRAINT DF_Users_is_active DEFAULT 1;
  IF COL_LENGTH('Users', 'created_at') IS NULL
    ALTER TABLE Users ADD created_at DATETIME2 NOT NULL CONSTRAINT DF_Users_created_at DEFAULT GETUTCDATE();
  IF COL_LENGTH('Users', 'updated_at') IS NULL
    ALTER TABLE Users ADD updated_at DATETIME2 NOT NULL CONSTRAINT DF_Users_updated_at DEFAULT GETUTCDATE();
  `,
  `
  IF COL_LENGTH('IntakeRequests', 'start_date') IS NULL
    ALTER TABLE IntakeRequests ADD start_date DATE NULL;
  IF COL_LENGTH('IntakeRequests', 'completion_date') IS NULL
    ALTER TABLE IntakeRequests ADD completion_date DATE NULL;
  IF COL_LENGTH('IntakeRequests', 'approval_status') IS NULL
    ALTER TABLE IntakeRequests ADD approval_status NVARCHAR(30) NOT NULL CONSTRAINT DF_IntakeRequests_approval_status DEFAULT 'pending';
  UPDATE IntakeRequests
  SET approval_status = 'pending'
  WHERE approval_status IS NULL OR LTRIM(RTRIM(approval_status)) = '';
  `,
  `
  IF COL_LENGTH('Tasks', 'priority') IS NULL
    ALTER TABLE Tasks ADD priority NVARCHAR(20) NOT NULL CONSTRAINT DF_Tasks_priority DEFAULT 'Média';
  IF COL_LENGTH('Tasks', 'estimated_hours') IS NULL
    ALTER TABLE Tasks ADD estimated_hours DECIMAL(10,2) NULL;
  IF COL_LENGTH('Tasks', 'planned_start_date') IS NULL
    ALTER TABLE Tasks ADD planned_start_date DATE NULL;
  IF COL_LENGTH('Tasks', 'planned_end_date') IS NULL
    ALTER TABLE Tasks ADD planned_end_date DATE NULL;
  IF COL_LENGTH('Tasks', 'work_type') IS NULL
    ALTER TABLE Tasks ADD work_type NVARCHAR(100) NULL;
  IF COL_LENGTH('Tasks', 'work_item_id') IS NULL
    ALTER TABLE Tasks ADD work_item_id INT NULL;
  IF COL_LENGTH('Tasks', 'sort_order') IS NULL
    ALTER TABLE Tasks ADD sort_order INT NULL;
  `,
  `
  IF OBJECT_ID('WorkItems', 'U') IS NULL
  BEGIN
    CREATE TABLE WorkItems (
      id INT IDENTITY(1,1) PRIMARY KEY,
      project_id INT NOT NULL,
      backlog_item_id INT NULL,
      title NVARCHAR(255) NOT NULL,
      description NVARCHAR(MAX) NULL,
      assignee_id INT NULL,
      status NVARCHAR(50) NOT NULL CONSTRAINT DF_WorkItems_status DEFAULT 'Não iniciado',
      priority NVARCHAR(20) NOT NULL CONSTRAINT DF_WorkItems_priority DEFAULT 'Média',
      work_type NVARCHAR(100) NOT NULL,
      estimated_hours DECIMAL(10,2) NULL,
      planned_start_date DATE NULL,
      planned_end_date DATE NULL,
      done_criterion NVARCHAR(500) NULL,
      archived BIT NOT NULL CONSTRAINT DF_WorkItems_archived DEFAULT 0,
      created_at DATETIME2 NOT NULL CONSTRAINT DF_WorkItems_created_at DEFAULT GETDATE(),
      updated_at DATETIME2 NOT NULL CONSTRAINT DF_WorkItems_updated_at DEFAULT GETDATE(),
      CONSTRAINT FK_WorkItems_Project FOREIGN KEY (project_id) REFERENCES Projects(id),
      CONSTRAINT FK_WorkItems_Backlog FOREIGN KEY (backlog_item_id) REFERENCES BacklogItems(id),
      CONSTRAINT FK_WorkItems_Assignee FOREIGN KEY (assignee_id) REFERENCES Users(id)
    );
  END
  `,
  `
  IF OBJECT_ID('WorkItems', 'U') IS NOT NULL
     AND COL_LENGTH('Tasks', 'work_item_id') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Tasks_WorkItems')
  BEGIN
    ALTER TABLE Tasks
    ADD CONSTRAINT FK_Tasks_WorkItems FOREIGN KEY (work_item_id) REFERENCES WorkItems(id);
  END
  `,
  `
  IF OBJECT_ID('ProjectUpdates', 'U') IS NULL
  BEGIN
    CREATE TABLE ProjectUpdates (
      id INT IDENTITY(1,1) PRIMARY KEY,
      project_id INT NOT NULL,
      entity_type NVARCHAR(50) NOT NULL,
      entity_id INT NULL,
      change_type NVARCHAR(50) NOT NULL,
      changed_by INT NULL,
      changed_at DATETIME2 NOT NULL CONSTRAINT DF_ProjectUpdates_changed_at DEFAULT GETDATE(),
      description NVARCHAR(500) NOT NULL,
      CONSTRAINT FK_ProjectUpdates_Project FOREIGN KEY (project_id) REFERENCES Projects(id),
      CONSTRAINT FK_ProjectUpdates_User FOREIGN KEY (changed_by) REFERENCES Users(id)
    );
  END
  `,
  `
  IF OBJECT_ID('ProjectCapacitySettings', 'U') IS NULL
  BEGIN
    CREATE TABLE ProjectCapacitySettings (
      id INT IDENTITY(1,1) PRIMARY KEY,
      project_id INT NOT NULL,
      user_id INT NOT NULL,
      weekly_capacity_hours DECIMAL(10,2) NOT NULL CONSTRAINT DF_ProjectCapacitySettings_capacity DEFAULT 40,
      created_at DATETIME2 NOT NULL CONSTRAINT DF_ProjectCapacitySettings_created_at DEFAULT GETDATE(),
      updated_at DATETIME2 NOT NULL CONSTRAINT DF_ProjectCapacitySettings_updated_at DEFAULT GETDATE(),
      CONSTRAINT UQ_ProjectCapacitySettings UNIQUE (project_id, user_id),
      CONSTRAINT FK_ProjectCapacitySettings_Project FOREIGN KEY (project_id) REFERENCES Projects(id),
      CONSTRAINT FK_ProjectCapacitySettings_User FOREIGN KEY (user_id) REFERENCES Users(id)
    );
  END
  `,
  `
  IF OBJECT_ID('TeamAssignments', 'U') IS NULL
  BEGIN
    CREATE TABLE TeamAssignments (
      id INT IDENTITY(1,1) PRIMARY KEY,
      context_type NVARCHAR(50) NOT NULL,
      context_id INT NULL,
      user_id INT NOT NULL,
      assigned_role NVARCHAR(255) NOT NULL,
      division_id INT NOT NULL,
      requested_by_user_id INT NOT NULL,
      requested_by_division_id INT NULL,
      approval_status NVARCHAR(30) NOT NULL CONSTRAINT DF_TeamAssignments_approval_status DEFAULT 'APPROVED',
      approval_required BIT NOT NULL CONSTRAINT DF_TeamAssignments_approval_required DEFAULT 0,
      approved_by_user_id INT NULL,
      approved_at DATETIME2 NULL,
      rejected_by_user_id INT NULL,
      rejected_at DATETIME2 NULL,
      rejection_reason NVARCHAR(500) NULL,
      notes NVARCHAR(1000) NULL,
      is_cancelled BIT NOT NULL CONSTRAINT DF_TeamAssignments_is_cancelled DEFAULT 0,
      created_at DATETIME2 NOT NULL CONSTRAINT DF_TeamAssignments_created_at DEFAULT GETUTCDATE(),
      updated_at DATETIME2 NOT NULL CONSTRAINT DF_TeamAssignments_updated_at DEFAULT GETUTCDATE(),
      CONSTRAINT FK_TeamAssignments_User FOREIGN KEY (user_id) REFERENCES Users(id),
      CONSTRAINT FK_TeamAssignments_Division FOREIGN KEY (division_id) REFERENCES Divisions(id),
      CONSTRAINT FK_TeamAssignments_RequestedBy FOREIGN KEY (requested_by_user_id) REFERENCES Users(id)
    );
  END
  `,
  `
  IF OBJECT_ID('AuditLogs', 'U') IS NULL
  BEGIN
    CREATE TABLE AuditLogs (
      id INT IDENTITY(1,1) PRIMARY KEY,
      entity_type NVARCHAR(100) NOT NULL,
      entity_id INT NULL,
      action NVARCHAR(100) NOT NULL,
      performed_by INT NULL,
      details NVARCHAR(1000) NULL,
      created_at DATETIME2 NOT NULL CONSTRAINT DF_AuditLogs_created_at DEFAULT GETUTCDATE()
    );
  END
  `,
];

const initializeSchema = async () => {
  const pool = await poolPromise;

  for (const statement of schemaStatements) {
    await pool.request().batch(statement);
  }

  for (const division of DIVISIONS) {
    await pool.request()
      .input('code', division.code)
      .input('name', division.name)
      .input('is_active', division.isActive ? 1 : 0)
      .query(`
        IF EXISTS (SELECT 1 FROM Divisions WHERE code = @code)
          UPDATE Divisions SET name = @name, is_active = @is_active, updated_at = GETUTCDATE() WHERE code = @code;
        ELSE
          INSERT INTO Divisions (name, code, is_active) VALUES (@name, @code, @is_active);
      `);
  }

  for (const role of ROLES) {
    await pool.request()
      .input('code', role.code)
      .input('name', role.name)
      .input('is_active', role.isActive ? 1 : 0)
      .query(`
        IF EXISTS (SELECT 1 FROM Roles WHERE code = @code)
          UPDATE Roles SET name = @name, is_active = @is_active, updated_at = GETUTCDATE() WHERE code = @code;
        ELSE
          INSERT INTO Roles (name, code, is_active) VALUES (@name, @code, @is_active);
      `);
  }

  await pool.request().batch(`
    DECLARE @directionId INT = (SELECT TOP 1 id FROM Divisions WHERE code = 'DIRECAO');
    UPDATE Users SET display_name = username WHERE display_name IS NULL;
    UPDATE Users SET division_id = @directionId WHERE division_id IS NULL AND @directionId IS NOT NULL;

    IF NOT EXISTS (
      SELECT 1
      FROM sys.foreign_keys
      WHERE name = 'FK_Users_Divisions'
    )
    BEGIN
      ALTER TABLE Users
      ADD CONSTRAINT FK_Users_Divisions FOREIGN KEY (division_id) REFERENCES Divisions(id);
    END
  `);

  await pool.request().batch(`
    DECLARE @dropSql NVARCHAR(MAX) = N'';
    SELECT @dropSql = @dropSql + N'ALTER TABLE Users DROP CONSTRAINT [' + cc.name + N'];'
    FROM sys.check_constraints cc
    WHERE cc.parent_object_id = OBJECT_ID('Users')
      AND cc.definition LIKE '%[role]%';
    IF LEN(@dropSql) > 0
      EXEC sp_executesql @dropSql;
  `);

  const escapedRoles = ROLES.map((role) => `'${role.name.replace(/'/g, "''")}'`).join(', ');
  await pool.request().batch(`
    IF NOT EXISTS (
      SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Users_Role'
    )
    BEGIN
      ALTER TABLE Users
      ADD CONSTRAINT CK_Users_Role CHECK (role IN (${escapedRoles}));
    END
  `);
};

module.exports = {
  initializeSchema,
};
