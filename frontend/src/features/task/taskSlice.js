import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const fetchTasks = createAsyncThunk('task/fetchTasks', async (backlogId, { rejectWithValue }) => {
  try {
    const response = await api.get(`/tasks/backlog/${backlogId}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not load tasks' });
  }
});

export const fetchProjectTasks = createAsyncThunk('task/fetchProjectTasks', async (projectId, { rejectWithValue }) => {
  try {
    const response = await api.get(`/tasks/project/${projectId}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not load project tasks' });
  }
});

export const createTask = createAsyncThunk('task/createTask', async (taskData, { rejectWithValue }) => {
  try {
    const response = await api.post('/tasks', taskData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not create task' });
  }
});

export const updateTask = createAsyncThunk('task/updateTask', async ({ id, ...data }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not update task' });
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
        const backlogId = action.meta.arg;
        const remainingTasks = state.tasks.filter((task) => task.backlog_item_id !== Number(backlogId));
        state.tasks = [...remainingTasks, ...action.payload];
      })
      .addCase(fetchProjectTasks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProjectTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchProjectTasks.rejected, (state, action) => {
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
