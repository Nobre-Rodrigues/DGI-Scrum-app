const {
  ASSIGNMENT_APPROVAL_STATUSES,
  ASSIGNMENT_CONTEXT_TYPES,
  ROLE_NAMES,
} = require('../constants/team');

const FULL_ADMIN_ROLES = new Set([
  'Diretor',
  'Subdiretor',
  'Chefe da Divisão de Gestão da Informação',
  'Product Owner',
  'Director',
]);

const DIVISION_MANAGER_ROLES = {
  'Chefe da Divisão de Análise da Informação': 'DAI',
  'Chefe da Divisão de Sistemas de Informação': 'DSI',
};

const normalizeContextType = (value) => String(value || '').toUpperCase();

const isFullAdmin = (role) => FULL_ADMIN_ROLES.has(role);

const getManagedDivisionCode = (role) => DIVISION_MANAGER_ROLES[role] || null;

const canManageAllDivisions = (user) => isFullAdmin(user?.role);

const canManageOwnDivision = (user) => Boolean(getManagedDivisionCode(user?.role));

const canManageUsers = (user) => isFullAdmin(user?.role) || canManageOwnDivision(user);

const canAssignRole = (user) => canManageUsers(user);

const canNominateUser = (user) => canManageUsers(user);

const canAccessTeamArea = (user) => Boolean(user?.id);

const isRoleValid = (role) => ROLE_NAMES.includes(role);

const isAssignmentContextValid = (contextType) => ASSIGNMENT_CONTEXT_TYPES.includes(normalizeContextType(contextType));

const isApprovalStatusValid = (status) => ASSIGNMENT_APPROVAL_STATUSES.includes(String(status || '').toUpperCase());

const canManageTargetUser = (actor, targetDivisionCode) => {
  if (isFullAdmin(actor?.role)) {
    return true;
  }

  const managedDivision = getManagedDivisionCode(actor?.role);
  return Boolean(managedDivision && targetDivisionCode && managedDivision === targetDivisionCode);
};

const canApproveParticipation = ({ actor, assignmentTargetDivisionCode }) => {
  if (isFullAdmin(actor?.role)) {
    return true;
  }

  const managedDivision = getManagedDivisionCode(actor?.role);
  return Boolean(managedDivision && assignmentTargetDivisionCode && managedDivision === assignmentTargetDivisionCode);
};

const getAssignmentDecision = ({ actor, actorDivisionCode, targetDivisionCode }) => {
  if (isFullAdmin(actor?.role)) {
    return {
      approvalRequired: false,
      approvalStatus: 'APPROVED',
    };
  }

  const managedDivision = getManagedDivisionCode(actor?.role);
  if (managedDivision && managedDivision === targetDivisionCode && actorDivisionCode === targetDivisionCode) {
    return {
      approvalRequired: false,
      approvalStatus: 'APPROVED',
    };
  }

  return {
    approvalRequired: true,
    approvalStatus: 'PENDING',
  };
};

const buildPermissions = (user) => ({
  canManageUsers: canManageUsers(user),
  canAssignRole: canAssignRole(user),
  canNominateUser: canNominateUser(user),
  canApproveParticipation: isFullAdmin(user?.role) || canManageOwnDivision(user),
  canManageAllDivisions: canManageAllDivisions(user),
  canManageOwnDivision: canManageOwnDivision(user),
  canAccessTeamArea: canAccessTeamArea(user),
});

module.exports = {
  FULL_ADMIN_ROLES,
  isFullAdmin,
  getManagedDivisionCode,
  canManageAllDivisions,
  canManageOwnDivision,
  canManageUsers,
  canAssignRole,
  canNominateUser,
  canAccessTeamArea,
  canManageTargetUser,
  canApproveParticipation,
  getAssignmentDecision,
  buildPermissions,
  isRoleValid,
  isAssignmentContextValid,
  isApprovalStatusValid,
};
