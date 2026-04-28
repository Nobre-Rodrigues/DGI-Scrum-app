import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import projectReducer from '../features/project/projectSlice';
import backlogReducer from '../features/backlog/backlogSlice';
import sprintReducer from '../features/sprint/sprintSlice';
import taskReducer from '../features/task/taskSlice';
import eventReducer from '../features/event/eventSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import userReducer from '../features/user/userSlice';
import intakeReducer from '../features/intake/intakeSlice';
import projectDashboardReducer from '../features/projectDashboard/projectDashboardSlice';
import workItemReducer from '../features/workItem/workItemSlice';
import divisionReducer from '../features/division/divisionSlice';
import roleReducer from '../features/role/roleSlice';
import teamAssignmentReducer from '../features/teamAssignment/teamAssignmentSlice';
import meReducer from '../features/me/meSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    project: projectReducer,
    backlog: backlogReducer,
    sprint: sprintReducer,
    task: taskReducer,
    event: eventReducer,
    dashboard: dashboardReducer,
    projectDashboard: projectDashboardReducer,
    user: userReducer,
    intake: intakeReducer,
    workItem: workItemReducer,
    division: divisionReducer,
    role: roleReducer,
    teamAssignment: teamAssignmentReducer,
    me: meReducer,
  },
});
