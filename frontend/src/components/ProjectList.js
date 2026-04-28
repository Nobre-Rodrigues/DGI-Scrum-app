import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects, createProject } from '../features/project/projectSlice';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Button, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';

const emptyProject = {
  name: '',
  description: '',
  start_date: '',
  end_date: '',
};

const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  const datePart = String(value).split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
};

const formatDateRange = (startDate, endDate) => {
  const formatter = new Intl.DateTimeFormat('pt-BR');
  const start = parseDateValue(startDate);
  const end = parseDateValue(endDate);

  if (start && end) {
    return `${formatter.format(start)} - ${formatter.format(end)}`;
  }

  if (start) {
    return `Inicio: ${formatter.format(start)}`;
  }

  if (end) {
    return `Fim: ${formatter.format(end)}`;
  }

  return '';
};

const ProjectList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projects } = useSelector((state) => state.project);
  const [open, setOpen] = useState(false);
  const [newProject, setNewProject] = useState(emptyProject);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleCreate = () => {
    dispatch(createProject({
      ...newProject,
      start_date: newProject.start_date || null,
      end_date: newProject.end_date || null,
    }));
    setOpen(false);
    setNewProject(emptyProject);
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Projects
      </Typography>
      <Button variant="contained" onClick={() => setOpen(true)}>Create Project</Button>
      <List>
        {projects.map(project => (
          <ListItem key={project.id} button onClick={() => navigate(`/projects/${project.id}`)}>
            <ListItemText
              primary={project.name}
              secondary={[project.description, formatDateRange(project.start_date, project.end_date)].filter(Boolean).join(' • ')}
            />
          </ListItem>
        ))}
      </List>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            multiline
            rows={4}
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
          />
          <TextField
            label="Data de inicio"
            type="date"
            fullWidth
            margin="normal"
            value={newProject.start_date}
            onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Data de fim"
            type="date"
            fullWidth
            margin="normal"
            value={newProject.end_date}
            onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectList;
