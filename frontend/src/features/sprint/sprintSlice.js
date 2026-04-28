import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const fetchSprints = createAsyncThunk('sprint/fetchSprints', async (projectId, { rejectWithValue }) => {
  try {
    const response = await api.get(`/sprints/project/${projectId}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not load sprints' });
  }
});

export const createSprint = createAsyncThunk('sprint/createSprint', async (sprintData, { rejectWithValue }) => {
  try {
    const response = await api.post('/sprints', sprintData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not create sprint' });
  }
});

export const updateSprint = createAsyncThunk('sprint/updateSprint', async ({ id, ...sprintData }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/sprints/${id}`, sprintData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not update sprint' });
  }
});

export const startSprint = createAsyncThunk('sprint/startSprint', async (id, { rejectWithValue }) => {
  try {
    const response = await api.put(`/sprints/${id}/start`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not start sprint' });
  }
});

const sprintSlice = createSlice({
  name: 'sprint',
  initialState: {
    sprints: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSprints.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSprints.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sprints = action.payload;
      })
      .addCase(fetchSprints.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createSprint.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createSprint.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sprints.push(action.payload);
      })
      .addCase(createSprint.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateSprint.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateSprint.fulfilled, (state, action) => {
        state.isLoading = false;
        const idx = state.sprints.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) {
          state.sprints[idx] = action.payload;
        }
      })
      .addCase(updateSprint.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(startSprint.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(startSprint.fulfilled, (state, action) => {
        state.isLoading = false;
        const idx = state.sprints.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) {
          state.sprints[idx] = action.payload;
        }
      })
      .addCase(startSprint.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default sprintSlice.reducer;
