import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const fetchDivisions = createAsyncThunk('division/fetchDivisions', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/divisions');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not load divisions' });
  }
});

const divisionSlice = createSlice({
  name: 'division',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDivisions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDivisions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDivisions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default divisionSlice.reducer;
