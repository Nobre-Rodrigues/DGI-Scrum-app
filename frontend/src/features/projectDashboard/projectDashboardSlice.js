import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const fetchProjectDashboard = createAsyncThunk('projectDashboard/fetchProjectDashboard', async (projectId, { rejectWithValue }) => {
  try {
    const response = await api.get(`/projects/${projectId}/dashboard`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not load project dashboard' });
  }
});

export const updateProjectStatus = createAsyncThunk('projectDashboard/updateProjectStatus', async ({ projectId, status }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/projects/${projectId}/status`, { status });
    return { projectId, ...response.data };
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not update project status' });
  }
});

export const updateProjectPriority = createAsyncThunk(
  'projectDashboard/updateProjectPriority',
  async ({ projectId, entityType, entityId, priority }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/projects/${projectId}/priorities/${entityType}/${entityId}`, { priority });
      return { projectId, entityType, entityId, priority, item: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Could not update priority' });
    }
  }
);

const projectDashboardSlice = createSlice({
  name: 'projectDashboard',
  initialState: {
    summary: null,
    isLoading: false,
    error: null,
    statusUpdateLoading: false,
    priorityUpdateLoading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchProjectDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateProjectStatus.pending, (state) => {
        state.statusUpdateLoading = true;
      })
      .addCase(updateProjectStatus.fulfilled, (state, action) => {
        state.statusUpdateLoading = false;
        if (state.summary?.project?.id === action.payload.id) {
          state.summary.project.status = action.payload.status;
          state.summary.state.status = action.payload.status;
        }
      })
      .addCase(updateProjectStatus.rejected, (state, action) => {
        state.statusUpdateLoading = false;
        state.error = action.payload;
      })
      .addCase(updateProjectPriority.pending, (state) => {
        state.priorityUpdateLoading = true;
      })
      .addCase(updateProjectPriority.fulfilled, (state, action) => {
        state.priorityUpdateLoading = false;
        if (!state.summary) {
          return;
        }

        state.summary.priorities.items = state.summary.priorities.items.map((item) => (
          item.entityType === action.payload.entityType && Number(item.id) === Number(action.payload.entityId)
            ? { ...item, priority: action.payload.priority }
            : item
        ));
      })
      .addCase(updateProjectPriority.rejected, (state, action) => {
        state.priorityUpdateLoading = false;
        state.error = action.payload;
      });
  },
});

export default projectDashboardSlice.reducer;

