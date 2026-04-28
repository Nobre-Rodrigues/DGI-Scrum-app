import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const fetchProjects = createAsyncThunk('project/fetchProjects', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/projects');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not load projects' });
  }
});

export const createProject = createAsyncThunk('project/createProject', async (projectData, { rejectWithValue }) => {
  try {
    const response = await api.post('/projects', projectData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not create project' });
  }
});

export const updateProject = createAsyncThunk('project/updateProject', async ({ id, ...projectData }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Could not update project' });
  }
});

const projectSlice = createSlice({
  name: 'project',
  initialState: {
    projects: [],
    currentProject: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createProject.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects.push(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateProject.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.isLoading = false;
        const idx = state.projects.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) {
          state.projects[idx] = action.payload;
        }
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = action.payload;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentProject } = projectSlice.actions;
export default projectSlice.reducer;
