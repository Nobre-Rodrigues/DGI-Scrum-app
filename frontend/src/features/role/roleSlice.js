import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const fetchRoles = createAsyncThunk('role/fetchRoles', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/roles');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not load roles' });
  }
});

const roleSlice = createSlice({
  name: 'role',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default roleSlice.reducer;
