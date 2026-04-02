import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/backlog';

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export const fetchBacklogItems = createAsyncThunk('backlog/fetchBacklogItems', async (projectId, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_URL}/project/${projectId}`, getAuthHeader());
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const createBacklogItem = createAsyncThunk('backlog/createBacklogItem', async (itemData, { rejectWithValue }) => {
  try {
    const response = await axios.post(API_URL, itemData, getAuthHeader());
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const updateBacklogItem = createAsyncThunk('backlog/updateBacklogItem', async ({ id, ...data }, { rejectWithValue }) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, data, getAuthHeader());
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
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
      });
  },
});

export default backlogSlice.reducer;