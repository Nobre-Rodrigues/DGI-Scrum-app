import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBacklogItems, createBacklogItem } from '../features/backlog/backlogSlice';
import { createTask } from '../features/task/taskSlice';
import { Container, Typography, Button, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Select, MenuItem, FormControl, InputLabel, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const Backlog = () => {
  const { id: projectId } = useParams();
  const dispatch = useDispatch();
  const { items: backlogItems } = useSelector((state) => state.backlog);
  const { tasks } = useSelector((state) => state.task);
  const [open, setOpen] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', description: '', story_points: '', priority: 'Must' });
  const [taskOpen, setTaskOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', assigned_to: '' });

  useEffect(() => {
    dispatch(fetchBacklogItems(projectId));
  }, [dispatch, projectId]);

  const handleCreateItem = () => {
    dispatch(createBacklogItem({ ...newItem, project_id: projectId }));
    setOpen(false);
    setNewItem({ title: '', description: '', story_points: '', priority: 'Must' });
  };

  const handleCreateTask = () => {
    dispatch(createTask({ ...newTask, backlog_item_id: selectedItem }));
    setTaskOpen(false);
    setNewTask({ title: '', description: '', assigned_to: '' });
  };

  const { user } = useSelector((state) => state.auth);

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Product Backlog
      </Typography>
      {(user?.role === 'Product Owner' || user?.role === 'Scrum Master') && (
        <Button variant="contained" onClick={() => setOpen(true)}>Add Backlog Item</Button>
      )}
      <List>
        {backlogItems.map(item => (
          <Accordion key={item.id}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <ListItemText primary={item.title} secondary={`Priority: ${item.priority}, Points: ${item.story_points}`} />
            </AccordionSummary>
            <AccordionDetails>
              <Typography>{item.description}</Typography>
              <Button onClick={() => { setSelectedItem(item.id); setTaskOpen(true); }}>Add Task</Button>
              <Typography variant="h6">Tasks:</Typography>
              <List>
                {tasks.filter(task => task.backlog_item_id === item.id).map(task => (
                  <ListItem key={task.id}>
                    <ListItemText primary={task.title} secondary={`Status: ${task.status}, Assigned: ${task.assigned_username}`} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </List>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add Backlog Item</DialogTitle>
        <DialogContent>
          <TextField label="Title" fullWidth margin="normal" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} />
          <TextField label="Description" fullWidth margin="normal" multiline rows={4} value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
          <TextField label="Story Points" type="number" fullWidth margin="normal" value={newItem.story_points} onChange={(e) => setNewItem({ ...newItem, story_points: parseInt(e.target.value) })} />
          <FormControl fullWidth margin="normal">
            <InputLabel>Priority</InputLabel>
            <Select value={newItem.priority} onChange={(e) => setNewItem({ ...newItem, priority: e.target.value })}>
              <MenuItem value="Must">Must</MenuItem>
              <MenuItem value="Should">Should</MenuItem>
              <MenuItem value="Could">Could</MenuItem>
              <MenuItem value="Won't">Won't</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateItem}>Add</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={taskOpen} onClose={() => setTaskOpen(false)}>
        <DialogTitle>Add Task</DialogTitle>
        <DialogContent>
          <TextField label="Title" fullWidth margin="normal" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
          <TextField label="Description" fullWidth margin="normal" multiline rows={4} value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
          <TextField label="Assigned To (User ID)" fullWidth margin="normal" value={newTask.assigned_to} onChange={(e) => setNewTask({ ...newTask, assigned_to: parseInt(e.target.value) })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateTask}>Add</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Backlog;