import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const fetchTeamAssignments = createAsyncThunk(
  'teamAssignment/fetchTeamAssignments',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/team-assignments', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Could not load team assignments' });
    }
  }
);

export const fetchPendingTeamAssignments = createAsyncThunk(
  'teamAssignment/fetchPendingTeamAssignments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/team-assignments/pending');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Could not load pending assignments' });
    }
  }
);

export const createTeamAssignment = createAsyncThunk(
  'teamAssignment/createTeamAssignment',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/team-assignments', payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Could not create team assignment' });
    }
  }
);

export const approveTeamAssignment = createAsyncThunk(
  'teamAssignment/approveTeamAssignment',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/team-assignments/${id}/approve`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Could not approve team assignment' });
    }
  }
);

export const rejectTeamAssignment = createAsyncThunk(
  'teamAssignment/rejectTeamAssignment',
  async ({ id, rejectionReason }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/team-assignments/${id}/reject`, { rejectionReason });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Could not reject team assignment' });
    }
  }
);

export const cancelTeamAssignment = createAsyncThunk(
  'teamAssignment/cancelTeamAssignment',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/team-assignments/${id}/cancel`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Could not cancel team assignment' });
    }
  }
);

const mergeAssignment = (items, assignment) => {
  const index = items.findIndex((item) => item.id === assignment.id);
  if (index === -1) {
    return [assignment, ...items];
  }

  const nextItems = [...items];
  nextItems[index] = assignment;
  return nextItems;
};

const teamAssignmentSlice = createSlice({
  name: 'teamAssignment',
  initialState: {
    items: [],
    pending: [],
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeamAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTeamAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPendingTeamAssignments.fulfilled, (state, action) => {
        state.pending = action.payload;
      })
      .addCase(fetchPendingTeamAssignments.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(createTeamAssignment.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createTeamAssignment.fulfilled, (state, action) => {
        state.saving = false;
        state.items = mergeAssignment(state.items, action.payload);
        if (action.payload.approvalStatus === 'PENDING') {
          state.pending = mergeAssignment(state.pending, action.payload);
        }
      })
      .addCase(createTeamAssignment.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(approveTeamAssignment.fulfilled, (state, action) => {
        state.items = mergeAssignment(state.items, action.payload);
        state.pending = state.pending.filter((item) => item.id !== action.payload.id);
      })
      .addCase(rejectTeamAssignment.fulfilled, (state, action) => {
        state.items = mergeAssignment(state.items, action.payload);
        state.pending = state.pending.filter((item) => item.id !== action.payload.id);
      })
      .addCase(cancelTeamAssignment.fulfilled, (state, action) => {
        state.items = mergeAssignment(state.items, action.payload);
        state.pending = state.pending.filter((item) => item.id !== action.payload.id);
      })
      .addMatcher(
        (action) => action.type.startsWith('teamAssignment/') && action.type.endsWith('/rejected'),
        (state, action) => {
          state.saving = false;
          state.error = action.payload;
        }
      );
  },
});

export default teamAssignmentSlice.reducer;
