import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBacklogItems } from '../features/backlog/backlogSlice';
import { fetchTasks, updateTask } from '../features/task/taskSlice';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import ProjectPageHeader from './ProjectPageHeader';

const columnTone = {
  'To Do': '#475467',
  'In Progress': '#034AD8',
  Review: '#B54708',
  Done: '#0F7B6C',
};

const priorityTone = {
  Crítica: { color: '#B42318', backgroundColor: '#FEF3F2' },
  Alta: { color: '#B54708', backgroundColor: '#FFF7ED' },
  Média: { color: '#1D4ED8', backgroundColor: '#EFF6FF' },
  Baixa: { color: '#0F7B6C', backgroundColor: '#ECFDF3' },
};

const legacyPriorityTone = {
  Must: priorityTone.Alta,
  Should: priorityTone.Média,
  Could: priorityTone.Baixa,
  "Won't": { color: '#475467', backgroundColor: '#F2F4F7' },
};

const getPriorityTone = (priority) => priorityTone[priority] || legacyPriorityTone[priority] || { color: '#475467', backgroundColor: '#F2F4F7' };

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
      <Stack spacing={3} mb={3}>
        <ProjectPageHeader
          projectId={projectId}
          current="kanban"
          eyebrow="Execução"
          titleOverride="Kanban Board"
          subtitle="Acompanhe o fluxo de trabalho com o mesmo grafismo institucional dos cartões do dashboard."
        />
      </Stack>
      <DragDropContext onDragEnd={onDragEnd}>
        <Grid container spacing={3}>
          {columns.map(column => (
            <Grid item xs={12} sm={6} md={3} key={column}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  borderColor: '#B7C0D0',
                  minHeight: 520,
                  position: 'relative',
                  overflow: 'visible',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    position: 'absolute',
                    top: -1,
                    left: 24,
                    width: 96,
                    height: 16,
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                    backgroundColor: columnTone[column],
                  }}
                />
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" component="h2" fontWeight={700}>
                      {column}
                    </Typography>
                    <Chip
                      label={tasks.filter(task => task.status === column).length}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        backgroundColor: `${columnTone[column]}14`,
                        color: columnTone[column],
                      }}
                    />
                  </Stack>
                <Droppable droppableId={column}>
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        minHeight: 420,
                        p: 0.5,
                        borderRadius: 2,
                        backgroundColor: '#F8FAFC',
                      }}
                    >
                      {tasks.filter(task => task.status === column).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              variant="outlined"
                              sx={{
                                mb: 1.5,
                                borderRadius: 3,
                                borderColor: '#D0D5DD',
                                backgroundColor: '#FFFFFF',
                                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                              }}
                              style={provided.draggableProps.style}
                            >
                              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Stack spacing={1.25}>
                                  <Typography fontWeight={700}>
                                    {task.title}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {task.description || 'Sem descrição'}
                                  </Typography>
                                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    <Chip
                                      label={task.status || 'Sem estado'}
                                      size="small"
                                      sx={{
                                        fontWeight: 600,
                                        backgroundColor: '#E9EEF6',
                                        color: '#182439',
                                      }}
                                    />
                                    {task.priority && (
                                      <Chip
                                        label={task.priority}
                                        size="small"
                                        sx={{
                                          fontWeight: 700,
                                          ...getPriorityTone(task.priority),
                                        }}
                                      />
                                    )}
                                  </Stack>
                                  <Stack spacing={0.5}>
                                    <Typography variant="caption" color="text.secondary">
                                      Responsável: {task.assigned_username || 'Sem responsável'}
                                    </Typography>
                                    {task.work_type && (
                                      <Typography variant="caption" color="text.secondary">
                                        Tipo: {task.work_type}
                                      </Typography>
                                    )}
                                    {task.estimated_hours && (
                                      <Typography variant="caption" color="text.secondary">
                                        Estimativa: {task.estimated_hours}h
                                      </Typography>
                                    )}
                                  </Stack>
                                </Stack>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {tasks.filter(task => task.status === column).length === 0 && (
                        <Box
                          sx={{
                            minHeight: 120,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            px: 2,
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Sem tarefas nesta coluna.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Droppable>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DragDropContext>
    </Container>
  );
};

export default Kanban;
