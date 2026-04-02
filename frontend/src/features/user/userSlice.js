import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users';

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export const fetchUsers = createAsyncThunk('user/fetchUsers', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(API_URL, getAuthHeader());
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not load users' });
  }
});

export const updateUser = createAsyncThunk('user/updateUser', async ({ id, ...data }, { rejectWithValue }) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, data, getAuthHeader());
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not update user' });
  }
});

export const deleteUser = createAsyncThunk('user/deleteUser', async (id, { rejectWithValue }) => {
  try {
    await axios.delete(`${API_URL}/${id}`, getAuthHeader());
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not delete user' });
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState: {
    users: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUsers.fulfilled, (state, action) => { state.loading = false; state.users = action.payload; })
      .addCase(fetchUsers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(updateUser.fulfilled, (state, action) => {
        const idx = state.users.findIndex(u => u.id === action.payload.id);
        if (idx !== -1) state.users[idx] = action.payload;
      })
      .addCase(updateUser.rejected, (state, action) => { state.error = action.payload; })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => { state.error = action.payload; });
  },
});

export default userSlice.reducer;
