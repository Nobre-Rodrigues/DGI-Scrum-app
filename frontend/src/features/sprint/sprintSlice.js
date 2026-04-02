import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/sprints';

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export const fetchSprints = createAsyncThunk('sprint/fetchSprints', async (projectId, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_URL}/project/${projectId}`, getAuthHeader());
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const createSprint = createAsyncThunk('sprint/createSprint', async (sprintData, { rejectWithValue }) => {
  try {
    const response = await axios.post(API_URL, sprintData, getAuthHeader());
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

const sprintSlice = createSlice({
  name: 'sprint',
  initialState: {
    sprints: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSprints.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSprints.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sprints = action.payload;
      })
      .addCase(fetchSprints.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createSprint.fulfilled, (state, action) => {
        state.sprints.push(action.payload);
      });
  },
});

export default sprintSlice.reducer;