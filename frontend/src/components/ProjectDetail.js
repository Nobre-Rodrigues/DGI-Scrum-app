import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentProject, updateProject } from '../features/project/projectSlice';
import { Container, Typography, Button, Grid, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';

const ProjectDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projects } = useSelector((state) => state.project);
  const { user } = useSelector((state) => state.auth);
  const project = projects.find(p => p.id === Number(id));
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '' });

  useEffect(() => {
    if (project) {
      dispatch(setCurrentProject(project));
      setEditData({ name: project.name, description: project.description });
    }
  }, [project, dispatch]);

  if (!project) return <Typography>Loading...</Typography>;

  const handleUpdateProject = () => {
    dispatch(updateProject({ id: project.id, ...editData }));
    setEditOpen(false);
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        {project.name}
      </Typography>
      <Typography variant="body1" gutterBottom>
        {project.description}
      </Typography>
      <Grid container spacing={2}>
        {user?.role === 'Product Owner' && (
          <Grid item>
            <Button variant="outlined" onClick={() => setEditOpen(true)}>
              Edit Project
            </Button>
          </Grid>
        )}
        <Grid item>
          <Button variant="contained" onClick={() => navigate(`/projects/${id}/backlog`)}>
            Backlog
          </Button>
        </Grid>
        <Grid item>
          <Button variant="contained" onClick={() => navigate(`/projects/${id}/kanban`)}>
            Kanban Board
          </Button>
        </Grid>
        <Grid item>
          <Button variant="contained" onClick={() => navigate(`/projects/${id}/calendar`)}>
            Calendar
          </Button>
        </Grid>
      </Grid>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Edit Project</DialogTitle>
        <DialogContent>
          <TextField label="Name" fullWidth margin="dense" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
          <TextField label="Description" fullWidth margin="dense" value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} multiline rows={3} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateProject} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default ProjectDetail;