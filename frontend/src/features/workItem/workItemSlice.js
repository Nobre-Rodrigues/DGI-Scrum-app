import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const fetchWorkItems = createAsyncThunk('workItem/fetchWorkItems', async (projectId, { rejectWithValue }) => {
  try {
    const response = await api.get(`/work-items/project/${projectId}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not load work items' });
  }
});

export const fetchWorkItemMetadata = createAsyncThunk('workItem/fetchWorkItemMetadata', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/work-items/types');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not load work item metadata' });
  }
});

export const createWorkItem = createAsyncThunk('workItem/createWorkItem', async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post('/work-items', payload);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not create work item' });
  }
});

export const updateWorkItem = createAsyncThunk('workItem/updateWorkItem', async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/work-items/${id}`, payload);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not update work item' });
  }
});

export const deleteWorkItem = createAsyncThunk('workItem/deleteWorkItem', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/work-items/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not delete work item' });
  }
});

export const archiveWorkItem = createAsyncThunk('workItem/archiveWorkItem', async (id, { rejectWithValue }) => {
  try {
    const response = await api.put(`/work-items/${id}/archive`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not archive work item' });
  }
});

const workItemSlice = createSlice({
  name: 'workItem',
  initialState: {
    items: [],
    metadata: {
      workTypes: [],
      priorities: [],
      statuses: [],
    },
    isLoading: false,
    isSaving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchWorkItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchWorkItemMetadata.fulfilled, (state, action) => {
        state.metadata = action.payload;
      })
      .addCase(createWorkItem.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(createWorkItem.fulfilled, (state, action) => {
        state.isSaving = false;
        state.items.unshift(action.payload);
      })
      .addCase(createWorkItem.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })
      .addCase(updateWorkItem.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(updateWorkItem.fulfilled, (state, action) => {
        state.isSaving = false;
        state.items = state.items.map((item) => (item.id === action.payload.id ? action.payload : item));
      })
      .addCase(updateWorkItem.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })
      .addCase(deleteWorkItem.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteWorkItem.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(archiveWorkItem.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload.id);
      })
      .addCase(archiveWorkItem.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default workItemSlice.reducer;

