import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const fetchBacklogItems = createAsyncThunk('backlog/fetchBacklogItems', async (projectId, { rejectWithValue }) => {
  try {
    const response = await api.get(`/backlog/project/${projectId}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not load backlog items' });
  }
});

export const createBacklogItem = createAsyncThunk('backlog/createBacklogItem', async (itemData, { rejectWithValue }) => {
  try {
    const response = await api.post('/backlog', itemData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not create backlog item' });
  }
});

export const updateBacklogItem = createAsyncThunk('backlog/updateBacklogItem', async ({ id, ...data }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/backlog/${id}`, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not update backlog item' });
  }
});

export const assignBacklogItemToSprint = createAsyncThunk('backlog/assignBacklogItemToSprint', async ({ id, sprint_id }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/backlog/${id}/sprint`, { sprint_id });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not assign backlog item to sprint' });
  }
});

const backlogSlice = createSlice({
  name: 'backlog',
  initialState: {
    items: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBacklogItems.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchBacklogItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchBacklogItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createBacklogItem.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateBacklogItem.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(assignBacklogItemToSprint.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export default backlogSlice.reducer;
