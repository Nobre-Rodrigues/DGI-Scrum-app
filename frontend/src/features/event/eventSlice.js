import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/events';

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export const fetchEvents = createAsyncThunk('event/fetchEvents', async (projectId, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_URL}/project/${projectId}`, getAuthHeader());
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

const eventSlice = createSlice({
  name: 'event',
  initialState: {
    events: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default eventSlice.reducer;