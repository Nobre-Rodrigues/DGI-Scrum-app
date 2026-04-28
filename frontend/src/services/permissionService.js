export const permissionService = {
  canManageUsers: (permissions) => Boolean(permissions?.canManageUsers),
  canAssignRole: (permissions) => Boolean(permissions?.canAssignRole),
  canNominateUser: (permissions) => Boolean(permissions?.canNominateUser),
  canApproveParticipation: (permissions) => Boolean(permissions?.canApproveParticipation),
  canManageAllDivisions: (permissions) => Boolean(permissions?.canManageAllDivisions),
  canManageOwnDivision: (permissions) => Boolean(permissions?.canManageOwnDivision),
  canAccessTeamArea: (permissions) => Boolean(permissions?.canAccessTeamArea),
};
