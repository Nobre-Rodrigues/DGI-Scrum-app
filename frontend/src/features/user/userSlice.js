import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const fetchUsers = createAsyncThunk('user/fetchUsers', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not load users' });
  }
});

export const fetchAssignableUsers = createAsyncThunk('user/fetchAssignableUsers', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/users/assignable');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not load assignable users' });
  }
});

export const fetchUserById = createAsyncThunk('user/fetchUserById', async (id, { rejectWithValue }) => {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not load user' });
  }
});

export const createUser = createAsyncThunk('user/createUser', async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post('/users', payload);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not create user' });
  }
});

export const updateUser = createAsyncThunk('user/updateUser', async ({ id, ...data }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not update user' });
  }
});

export const patchUserStatus = createAsyncThunk('user/patchUserStatus', async ({ id, isActive }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/users/${id}/status`, { isActive });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not update user status' });
  }
});

export const deleteUser = createAsyncThunk('user/deleteUser', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/users/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not delete user' });
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState: {
    users: [],
    assignableUsers: [],
    selectedUser: null,
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUsers.fulfilled, (state, action) => { state.loading = false; state.users = action.payload; })
      .addCase(fetchUsers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchAssignableUsers.fulfilled, (state, action) => { state.assignableUsers = action.payload; })
      .addCase(fetchAssignableUsers.rejected, (state, action) => { state.error = action.payload; })
      .addCase(fetchUserById.fulfilled, (state, action) => { state.selectedUser = action.payload; })
      .addCase(createUser.pending, (state) => { state.saving = true; state.error = null; })
      .addCase(createUser.fulfilled, (state, action) => {
        state.saving = false;
        state.users.unshift(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => { state.saving = false; state.error = action.payload; })
      .addCase(updateUser.pending, (state) => { state.saving = true; state.error = null; })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.saving = false;
        const idx = state.users.findIndex(u => u.id === action.payload.id);
        if (idx !== -1) state.users[idx] = action.payload;
        if (state.selectedUser?.id === action.payload.id) state.selectedUser = action.payload;
      })
      .addCase(updateUser.rejected, (state, action) => { state.saving = false; state.error = action.payload; })
      .addCase(patchUserStatus.fulfilled, (state, action) => {
        const idx = state.users.findIndex(u => u.id === action.payload.id);
        if (idx !== -1) state.users[idx] = action.payload;
        if (state.selectedUser?.id === action.payload.id) state.selectedUser = action.payload;
      })
      .addCase(patchUserStatus.rejected, (state, action) => { state.error = action.payload; })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => { state.error = action.payload; });
  },
});

export default userSlice.reducer;
