import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import projectReducer from '../features/project/projectSlice';
import backlogReducer from '../features/backlog/backlogSlice';
import sprintReducer from '../features/sprint/sprintSlice';
import taskReducer from '../features/task/taskSlice';
import eventReducer from '../features/event/eventSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import userReducer from '../features/user/userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    project: projectReducer,
    backlog: backlogReducer,
    sprint: sprintReducer,
    task: taskReducer,
    event: eventReducer,
    dashboard: dashboardReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;