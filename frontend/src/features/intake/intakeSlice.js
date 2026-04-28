import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const fetchIntakes = createAsyncThunk('intake/fetchIntakes', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/intake');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const fetchIntakeById = createAsyncThunk('intake/fetchIntakeById', async (id, { rejectWithValue }) => {
  try {
    const response = await api.get(`/intake/${id}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const createIntake = createAsyncThunk('intake/createIntake', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post('/intake', data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const updateIntakeApprovalStatus = createAsyncThunk('intake/updateIntakeApprovalStatus', async ({ id, approval_status, director_notes }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/intake/${id}/approval-status`, { approval_status, director_notes });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

const intakeSlice = createSlice({
  name: 'intake',
  initialState: {
    intakes: [],
    currentIntake: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearCurrentIntake: (state) => {
      state.currentIntake = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIntakes.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchIntakes.fulfilled, (state, action) => { state.isLoading = false; state.intakes = action.payload; })
      .addCase(fetchIntakes.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchIntakeById.pending, (state) => { state.isLoading = true; })
      .addCase(fetchIntakeById.fulfilled, (state, action) => { state.isLoading = false; state.currentIntake = action.payload; })
      .addCase(fetchIntakeById.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(createIntake.pending, (state) => { state.isLoading = true; })
      .addCase(createIntake.fulfilled, (state, action) => { state.isLoading = false; state.intakes.unshift(action.payload); })
      .addCase(createIntake.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(updateIntakeApprovalStatus.fulfilled, (state, action) => {
        const { intake } = action.payload;
        const idx = state.intakes.findIndex(i => i.id === intake.id);
        if (idx !== -1) state.intakes[idx] = { ...state.intakes[idx], ...intake };
        if (state.currentIntake?.id === intake.id) state.currentIntake = { ...state.currentIntake, ...intake };
      });
  },
});

export const { clearCurrentIntake } = intakeSlice.actions;
export default intakeSlice.reducer;
