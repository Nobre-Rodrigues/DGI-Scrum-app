import { useSelector } from 'react-redux';
import { permissionService } from '../services/permissionService';

export const usePermissions = () => {
  const permissions = useSelector((state) => state.me.permissions);

  return {
    permissions,
    canManageUsers: permissionService.canManageUsers(permissions),
    canAssignRole: permissionService.canAssignRole(permissions),
    canNominateUser: permissionService.canNominateUser(permissions),
    canApproveParticipation: permissionService.canApproveParticipation(permissions),
    canManageAllDivisions: permissionService.canManageAllDivisions(permissions),
    canManageOwnDivision: permissionService.canManageOwnDivision(permissions),
    canAccessTeamArea: permissionService.canAccessTeamArea(permissions),
  };
};
