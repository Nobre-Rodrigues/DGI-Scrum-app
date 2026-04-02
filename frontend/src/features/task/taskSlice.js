import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/tasks';

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export const fetchTasks = createAsyncThunk('task/fetchTasks', async (backlogId, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_URL}/backlog/${backlogId}`, getAuthHeader());
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const createTask = createAsyncThunk('task/createTask', async (taskData, { rejectWithValue }) => {
  try {
    const response = await axios.post(API_URL, taskData, getAuthHeader());
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const updateTask = createAsyncThunk('task/updateTask', async ({ id, ...data }, { rejectWithValue }) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, data, getAuthHeader());
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

const taskSlice = createSlice({
  name: 'task',
  initialState: {
    tasks: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      });
  },
});

export default taskSlice.reducer;