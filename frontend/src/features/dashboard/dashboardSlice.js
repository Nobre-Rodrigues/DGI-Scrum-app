import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const fetchDashboardData = createAsyncThunk('dashboard/fetchDashboardData', async (projectId, { rejectWithValue }) => {
  try {
    const response = await api.get(`/dashboard/project/${projectId}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not load dashboard data' });
  }
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    data: null,
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
