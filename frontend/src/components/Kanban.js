import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBacklogItems } from '../features/backlog/backlogSlice';
import { fetchTasks, updateTask } from '../features/task/taskSlice';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Container, Typography, Paper, Grid } from '@mui/material';

const Kanban = () => {
  const { id: projectId } = useParams();
  const dispatch = useDispatch();
  const { items: backlogItems } = useSelector((state) => state.backlog);
  const { tasks } = useSelector((state) => state.task);

  useEffect(() => {
    dispatch(fetchBacklogItems(projectId));
    backlogItems.forEach(item => dispatch(fetchTasks(item.id)));
  }, [dispatch, projectId, backlogItems]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    dispatch(updateTask({ id: draggableId, status: newStatus }));
  };

  const columns = ['To Do', 'In Progress', 'Review', 'Done'];

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Kanban Board
      </Typography>
      <DragDropContext onDragEnd={onDragEnd}>
        <Grid container spacing={2}>
          {columns.map(column => (
            <Grid item xs={12} sm={6} md={3} key={column}>
              <Paper style={{ padding: 16, minHeight: 400 }}>
                <Typography variant="h6">{column}</Typography>
                <Droppable droppableId={column}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {tasks.filter(task => task.status === column).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                          {(provided) => (
                            <Paper
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{ padding: 8, marginBottom: 8, ...provided.draggableProps.style }}
                            >
                              <Typography>{task.title}</Typography>
                              <Typography variant="body2">{task.description}</Typography>
                            </Paper>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DragDropContext>
    </Container>
  );
};

export default Kanban;