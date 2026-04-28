import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const fetchMyContext = createAsyncThunk('me/fetchMyContext', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/me/context');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not load my context' });
  }
});

export const fetchMyPermissions = createAsyncThunk('me/fetchMyPermissions', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/me/permissions');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not load my permissions' });
  }
});

const meSlice = createSlice({
  name: 'me',
  initialState: {
    context: null,
    permissions: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyContext.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyContext.fulfilled, (state, action) => {
        state.loading = false;
        state.context = action.payload;
      })
      .addCase(fetchMyContext.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyPermissions.fulfilled, (state, action) => {
        state.permissions = action.payload;
      })
      .addCase(fetchMyPermissions.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default meSlice.reducer;
