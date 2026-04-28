import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  assignBacklogItemToSprint,
  createBacklogItem,
  fetchBacklogItems,
  updateBacklogItem,
} from '../features/backlog/backlogSlice';
import { createSprint, fetchSprints, startSprint, updateSprint } from '../features/sprint/sprintSlice';
import { createTask, fetchProjectTasks } from '../features/task/taskSlice';
import {
  createWorkItem,
  fetchWorkItemMetadata,
  fetchWorkItems,
} from '../features/workItem/workItemSlice';
import { fetchAssignableUsers } from '../features/user/userSlice';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import PlaylistAddCheckCircleOutlinedIcon from '@mui/icons-material/PlaylistAddCheckCircleOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import ArrowUpwardOutlinedIcon from '@mui/icons-material/ArrowUpwardOutlined';
import ArrowDownwardOutlinedIcon from '@mui/icons-material/ArrowDownwardOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ProjectPageHeader from './ProjectPageHeader';

const PAGE_SIZE = 5;

const priorityOptions = [
  { value: 'Must', label: 'Alta' },
  { value: 'Should', label: 'Média' },
  { value: 'Could', label: 'Baixa' },
  { value: "Won't", label: 'Não fazer' },
];
const storyPointOptions = [1, 2, 3, 5, 8, 13];

const emptyBacklogForm = {
  title: '',
  description: '',
  story_points: 3,
  priority: 'Should',
  definition_of_done: '',
  sprint_id: '',
};

const emptyTaskForm = {
  title: '',
  description: '',
  assigned_to: '',
  priority: 'Média',
  estimated_hours: '',
  planned_start_date: '',
  planned_end_date: '',
  work_type: '',
};

const emptySprintForm = {
  name: '',
  start_date: '',
  end_date: '',
  status: 'planned',
};

const emptyWorkPackageForm = {
  title: '',
  description: '',
  assignee_id: '',
  status: 'Não iniciado',
  priority: 'Média',
  work_type: 'Análise',
  estimated_hours: '',
  planned_start_date: '',
  planned_end_date: '',
  done_criterion: '',
  tasks: [],
};

const createEmptyPackageTask = (overrides = {}) => ({
  title: '',
  description: '',
  assigned_to: '',
  priority: 'Média',
  work_type: 'Análise',
  estimated_hours: '',
  planned_start_date: '',
  planned_end_date: '',
  ...overrides,
});

const priorityTone = {
  Crítica: { color: '#B42318', backgroundColor: '#FEF3F2' },
  Alta: { color: '#B54708', backgroundColor: '#FFF7ED' },
  Média: { color: '#1D4ED8', backgroundColor: '#EFF6FF' },
  Baixa: { color: '#0F7B6C', backgroundColor: '#ECFDF3' },
  'Não fazer': { color: '#475467', backgroundColor: '#F2F4F7' },
  Must: { color: '#B54708', backgroundColor: '#FFF7ED' },
  Should: { color: '#1D4ED8', backgroundColor: '#EFF6FF' },
  Could: { color: '#0F7B6C', backgroundColor: '#ECFDF3' },
  "Won't": { color: '#475467', backgroundColor: '#F2F4F7' },
};

const backlogPriorityLabel = (priority) => {
  switch (priority) {
    case 'Must':
      return 'Alta';
    case 'Should':
      return 'Média';
    case 'Could':
      return 'Baixa';
    case "Won't":
      return 'Não fazer';
    default:
      return priority || 'Média';
  }
};

const sprintTone = {
  planned: { label: 'Planeado', color: '#175CD3', backgroundColor: '#EFF8FF' },
  active: { label: 'Ativo', color: '#027A48', backgroundColor: '#ECFDF3' },
  completed: { label: 'Concluído', color: '#344054', backgroundColor: '#F2F4F7' },
  cancelled: { label: 'Cancelado', color: '#B42318', backgroundColor: '#FEF3F2' },
};

const cardShellSx = {
  borderRadius: 3,
  borderColor: '#B7C0D0',
  position: 'relative',
  overflow: 'visible',
  backgroundColor: '#FFFFFF',
};

const topAccent = (color) => ({
  position: 'absolute',
  top: -1,
  left: 24,
  width: 112,
  height: 16,
  borderTopLeftRadius: 10,
  borderTopRightRadius: 10,
  backgroundColor: color,
});

const Backlog = () => {
  const { id: projectId } = useParams();
  const dispatch = useDispatch();
  const { items: backlogItems, error: backlogError } = useSelector((state) => state.backlog);
  const { tasks } = useSelector((state) => state.task);
  const { sprints } = useSelector((state) => state.sprint);
  const { items: workItems, metadata } = useSelector((state) => state.workItem);
  const { assignableUsers } = useSelector((state) => state.user);
  const { user } = useSelector((state) => state.auth);

  const [page, setPage] = useState(1);
  const [backlogDialogOpen, setBacklogDialogOpen] = useState(false);
  const [sprintDialogOpen, setSprintDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [workPackageDialogOpen, setWorkPackageDialogOpen] = useState(false);
  const [selectedBacklogItem, setSelectedBacklogItem] = useState(null);
  const [backlogForm, setBacklogForm] = useState(emptyBacklogForm);
  const [sprintForm, setSprintForm] = useState(emptySprintForm);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [workPackageForm, setWorkPackageForm] = useState(emptyWorkPackageForm);
  const [formError, setFormError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [workloadFilter, setWorkloadFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [workTypeFilter, setWorkTypeFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchBacklogItems(projectId));
    dispatch(fetchProjectTasks(projectId));
    dispatch(fetchSprints(projectId));
    dispatch(fetchWorkItems(projectId));
    dispatch(fetchWorkItemMetadata());
    dispatch(fetchAssignableUsers());
  }, [dispatch, projectId]);

  const canPlan = user?.role === 'Product Owner' || user?.role === 'Scrum Master' || user?.role === 'Director';

  const getItemTasks = useCallback(
    (backlogItemId) => tasks.filter((task) => Number(task.backlog_item_id) === Number(backlogItemId)),
    [tasks]
  );
  const getItemWorkPackages = useCallback(
    (backlogItemId) => workItems.filter((item) => Number(item.backlog_item_id) === Number(backlogItemId)),
    [workItems]
  );
  const getWorkPackageTasks = useCallback(
    (workItemId) => tasks.filter((task) => Number(task.work_item_id) === Number(workItemId)),
    [tasks]
  );
  const getStandaloneItemTasks = useCallback(
    (backlogItemId) => tasks.filter(
      (task) => Number(task.backlog_item_id) === Number(backlogItemId) && !task.work_item_id
    ),
    [tasks]
  );

  const assigneeOptions = useMemo(() => {
    const values = new Map();

    tasks.forEach((task) => {
      if (task.assigned_to) {
        values.set(String(task.assigned_to), task.assigned_username || `Utilizador ${task.assigned_to}`);
      }
    });

    workItems.forEach((item) => {
      if (item.assignee_id) {
        values.set(String(item.assignee_id), item.assignee_name || `Utilizador ${item.assignee_id}`);
      }
    });

    return Array.from(values.entries()).map(([id, name]) => ({ id, name })).sort((left, right) => left.name.localeCompare(right.name));
  }, [tasks, workItems]);

  const workTypeOptions = useMemo(() => {
    const values = new Set(metadata.workTypes);
    tasks.forEach((task) => {
      if (task.work_type) {
        values.add(task.work_type);
      }
    });
    workItems.forEach((item) => {
      if (item.work_type) {
        values.add(item.work_type);
      }
    });
    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [metadata.workTypes, tasks, workItems]);

  const filteredItems = useMemo(() => backlogItems.filter((item) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch = !normalizedSearch || [
      item.title,
      item.description,
      item.definition_of_done,
      item.sprint_name,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));

    const normalizedPriority = backlogPriorityLabel(item.priority);
    const matchesPriority = priorityFilter === 'all' || normalizedPriority === priorityFilter;
    const totalWorks = getItemTasks(item.id).length + getItemWorkPackages(item.id).length;
    const itemTasks = getItemTasks(item.id);
    const itemPackages = getItemWorkPackages(item.id);
    const matchesWorkload = workloadFilter === 'all'
      || (workloadFilter === 'with-work' && totalWorks > 0)
      || (workloadFilter === 'without-work' && totalWorks === 0);
    const matchesAssignee = assigneeFilter === 'all'
      || itemTasks.some((task) => String(task.assigned_to) === String(assigneeFilter))
      || itemPackages.some((workItem) => String(workItem.assignee_id) === String(assigneeFilter));
    const matchesWorkType = workTypeFilter === 'all'
      || itemTasks.some((task) => task.work_type === workTypeFilter)
      || itemPackages.some((workItem) => workItem.work_type === workTypeFilter);

    return matchesSearch && matchesPriority && matchesWorkload && matchesAssignee && matchesWorkType;
  }), [backlogItems, searchTerm, priorityFilter, workloadFilter, assigneeFilter, workTypeFilter, getItemTasks, getItemWorkPackages]);

  const groupedBacklog = useMemo(() => ({
    sprint: filteredItems.filter((item) => item.sprint_id),
    backlog: filteredItems.filter((item) => !item.sprint_id),
  }), [filteredItems]);

  const pagedBacklog = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return groupedBacklog.backlog.slice(startIndex, startIndex + PAGE_SIZE);
  }, [groupedBacklog.backlog, page]);

  const backlogPageCount = Math.max(1, Math.ceil(groupedBacklog.backlog.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [searchTerm, priorityFilter, workloadFilter, assigneeFilter, workTypeFilter]);

  const openTaskDialog = (item) => {
    setSelectedBacklogItem(item);
    setTaskForm({
      ...emptyTaskForm,
      work_type: metadata.workTypes[0] || '',
    });
    setFormError('');
    setTaskDialogOpen(true);
  };

  const openWorkPackageDialog = (item) => {
    setSelectedBacklogItem(item);
    setWorkPackageForm({
      ...emptyWorkPackageForm,
      work_type: metadata.workTypes[0] || 'Análise',
      priority: metadata.priorities[2] || 'Média',
      status: metadata.statuses[0] || 'Não iniciado',
      done_criterion: item.definition_of_done || '',
      tasks: [
        createEmptyPackageTask({
          priority: metadata.priorities[2] || 'Média',
          work_type: metadata.workTypes[0] || 'Análise',
        }),
      ],
    });
    setFormError('');
    setWorkPackageDialogOpen(true);
  };

  const refreshData = () => {
    dispatch(fetchBacklogItems(projectId));
    dispatch(fetchProjectTasks(projectId));
    dispatch(fetchSprints(projectId));
    dispatch(fetchWorkItems(projectId));
  };

  const openCreateBacklogDialog = (sprintId = '') => {
    setFormError('');
    setSelectedBacklogItem(null);
    setBacklogForm({
      ...emptyBacklogForm,
      sprint_id: sprintId || '',
    });
    setBacklogDialogOpen(true);
  };

  const handleCreateBacklogItem = async () => {
    if (!backlogForm.title.trim()) {
      setFormError('O backlog item precisa de um título.');
      return;
    }

    const result = await dispatch(createBacklogItem({
      ...backlogForm,
      project_id: projectId,
      sprint_id: backlogForm.sprint_id || null,
    }));

    if (result.meta.requestStatus === 'fulfilled') {
      setBacklogDialogOpen(false);
      setBacklogForm(emptyBacklogForm);
      setFormError('');
      refreshData();
    } else {
      setFormError(result.payload?.message || 'Não foi possível criar o item de backlog.');
    }
  };

  const handleCreateSprint = async () => {
    if (!sprintForm.name.trim() || !sprintForm.start_date || !sprintForm.end_date) {
      setFormError('Preencha nome e datas do sprint.');
      return;
    }

    const result = await dispatch(createSprint({
      ...sprintForm,
      project_id: projectId,
    }));

    if (result.meta.requestStatus === 'fulfilled') {
      setSprintDialogOpen(false);
      setSprintForm(emptySprintForm);
      setFormError('');
      refreshData();
    } else {
      setFormError(result.payload?.message || 'Não foi possível criar o sprint.');
    }
  };

  const handleCreateTask = async () => {
    if (!selectedBacklogItem || !taskForm.title.trim()) {
      setFormError('A tarefa precisa de um título.');
      return;
    }

    const result = await dispatch(createTask({
      ...taskForm,
      backlog_item_id: selectedBacklogItem.id,
      assigned_to: taskForm.assigned_to || null,
      estimated_hours: taskForm.estimated_hours || null,
      planned_start_date: taskForm.planned_start_date || null,
      planned_end_date: taskForm.planned_end_date || null,
    }));

    if (result.meta.requestStatus === 'fulfilled') {
      setTaskDialogOpen(false);
      setTaskForm(emptyTaskForm);
      setSelectedBacklogItem(null);
      setFormError('');
      refreshData();
    } else {
      setFormError(result.payload?.message || 'Não foi possível criar a tarefa.');
    }
  };

  const handleCreateWorkPackage = async () => {
    if (!selectedBacklogItem || !workPackageForm.title.trim()) {
      setFormError('O pacote de trabalho precisa de um título.');
      return;
    }

    const invalidTaskIndex = workPackageForm.tasks.findIndex((task) => !task.title.trim());
    if (invalidTaskIndex !== -1) {
      setFormError(`A tarefa ${invalidTaskIndex + 1} do pacote precisa de um título.`);
      return;
    }

    const result = await dispatch(createWorkItem({
      ...workPackageForm,
      project_id: Number(projectId),
      backlog_item_id: selectedBacklogItem.id,
      assignee_id: workPackageForm.assignee_id || null,
      estimated_hours: workPackageForm.estimated_hours || null,
      planned_start_date: workPackageForm.planned_start_date || null,
      planned_end_date: workPackageForm.planned_end_date || null,
      tasks: workPackageForm.tasks.map((task, index) => ({
        ...task,
        assigned_to: task.assigned_to || workPackageForm.assignee_id || null,
        estimated_hours: task.estimated_hours || null,
        planned_start_date: task.planned_start_date || workPackageForm.planned_start_date || null,
        planned_end_date: task.planned_end_date || workPackageForm.planned_end_date || null,
        priority: task.priority || workPackageForm.priority,
        work_type: task.work_type || workPackageForm.work_type,
        sort_order: index + 1,
      })),
    }));

    if (result.meta.requestStatus === 'fulfilled') {
      setWorkPackageDialogOpen(false);
      setWorkPackageForm(emptyWorkPackageForm);
      setSelectedBacklogItem(null);
      setFormError('');
      refreshData();
    } else {
      setFormError(result.payload?.message || 'Não foi possível criar o pacote de trabalho.');
    }
  };

  const handleWorkPackageTaskChange = (index, field, value) => {
    setWorkPackageForm((current) => ({
      ...current,
      tasks: current.tasks.map((task, taskIndex) => (
        taskIndex === index ? { ...task, [field]: value } : task
      )),
    }));
  };

  const handleAddWorkPackageTask = () => {
    setWorkPackageForm((current) => ({
      ...current,
      tasks: [
        ...current.tasks,
        createEmptyPackageTask({
          priority: current.priority,
          work_type: current.work_type,
          assigned_to: current.assignee_id,
          planned_start_date: current.planned_start_date,
          planned_end_date: current.planned_end_date,
        }),
      ],
    }));
  };

  const handleRemoveWorkPackageTask = (index) => {
    setWorkPackageForm((current) => ({
      ...current,
      tasks: current.tasks.filter((_, taskIndex) => taskIndex !== index),
    }));
  };

  const moveWorkPackageTask = (index, direction) => {
    setWorkPackageForm((current) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.tasks.length) {
        return current;
      }

      const nextTasks = [...current.tasks];
      const [movedTask] = nextTasks.splice(index, 1);
      nextTasks.splice(nextIndex, 0, movedTask);

      return {
        ...current,
        tasks: nextTasks,
      };
    });
  };

  const handleAssignToSprint = async (itemId, sprintId) => {
    await dispatch(assignBacklogItemToSprint({ id: itemId, sprint_id: sprintId || null }));
    refreshData();
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) {
      return;
    }

    const draggableId = result.draggableId.replace('backlog-', '');
    const destinationId = result.destination.droppableId;
    const sprintId = destinationId === 'backlog-dropzone'
      ? null
      : destinationId.startsWith('sprint-')
        ? Number(destinationId.replace('sprint-', ''))
        : null;

    await handleAssignToSprint(Number(draggableId), sprintId);
  };

  const handleUpdateSprintDates = async (sprint) => {
    if (!sprint.start_date || !sprint.end_date) {
      return;
    }

    await dispatch(updateSprint({
      id: sprint.id,
      name: sprint.name,
      start_date: sprint.start_date,
      end_date: sprint.end_date,
      status: sprint.status || 'planned',
      project_id: projectId,
    }));
    refreshData();
  };

  const handleStartSprint = async (sprint) => {
    const result = await dispatch(startSprint(sprint.id));
    if (result.meta.requestStatus === 'fulfilled') {
      setFormError('');
      refreshData();
    } else {
      setFormError(result.payload?.message || 'Não foi possível iniciar o sprint.');
    }
  };

  const renderWorkloadPreview = (item) => {
    const itemTasks = getItemTasks(item.id);
    const standaloneTasks = getStandaloneItemTasks(item.id);
    const itemPackages = getItemWorkPackages(item.id);
    const totalWorks = itemTasks.length + itemPackages.length;

    return (
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip label={`${totalWorks} trabalhos`} size="small" />
          <Chip label={`${itemTasks.length} tarefas`} size="small" />
          <Chip label={`${itemPackages.length} pacotes`} size="small" />
          {item.story_points && <Chip label={`${item.story_points} pts`} size="small" />}
          {item.priority && (
            <Chip
              label={backlogPriorityLabel(item.priority)}
              size="small"
              sx={{ fontWeight: 700, ...(priorityTone[backlogPriorityLabel(item.priority)] || priorityTone.Média) }}
            />
          )}
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {item.description || 'Sem descrição adicional.'}
        </Typography>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Definition of Done
          </Typography>
          <Typography variant="body2">
            {item.definition_of_done || 'Ainda não foi definida.'}
          </Typography>
        </Box>

        <Stack spacing={1}>
          {(itemPackages.length > 0 || itemTasks.length > 0) ? (
            <>
              {itemPackages.slice(0, 2).map((workPackage) => {
                const packageTasks = getWorkPackageTasks(workPackage.id);

                return (
                <Box key={`wp-${workPackage.id}`} sx={{ border: '1px solid #D0D5DD', borderRadius: 2, p: 1.25 }}>
                  <Typography fontWeight={700}>{workPackage.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pacote de trabalho · {workPackage.assignee_name || 'Sem responsável'} · {workPackage.work_type} · {packageTasks.length} tarefa(s)
                  </Typography>
                  {packageTasks.length > 0 && (
                    <Stack spacing={0.75} mt={1.25}>
                      {packageTasks.map((task) => (
                        <Box key={`wp-task-${task.id}`} sx={{ pl: 1.5, borderLeft: '2px solid #D0D5DD' }}>
                          <Typography variant="body2" fontWeight={600}>
                            {task.sort_order ? `${task.sort_order}. ` : ''}{task.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {task.assigned_username || 'Sem responsável'} · {task.status || 'Sem estado'}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              )})}
              {standaloneTasks.slice(0, 2).map((task) => (
                <Box key={`task-${task.id}`} sx={{ border: '1px solid #D0D5DD', borderRadius: 2, p: 1.25 }}>
                  <Typography fontWeight={700}>{task.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tarefa · {task.assigned_username || 'Sem responsável'} · {task.status || 'Sem estado'}
                  </Typography>
                </Box>
              ))}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Ainda não existem tarefas ou pacotes de trabalho associados.
            </Typography>
          )}
        </Stack>
      </Stack>
    );
  };

  const renderBacklogCard = (item, accentColor = '#034AD8', provided = null) => {
    const sprintName = sprints.find((sprint) => Number(sprint.id) === Number(item.sprint_id))?.name || item.sprint_name;

    return (
      <Card
        key={item.id}
        variant="outlined"
        ref={provided?.innerRef}
        {...(provided?.draggableProps || {})}
        {...(provided?.dragHandleProps || {})}
        sx={{
          ...cardShellSx,
          cursor: provided ? 'grab' : 'default',
        }}
        style={provided?.draggableProps?.style}
      >
        <Box sx={topAccent(accentColor)} aria-hidden="true" />
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h6" fontWeight={800}>{item.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {sprintName ? `Planeado para ${sprintName}` : 'Item no backlog geral'}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                {canPlan && (
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel id={`sprint-select-${item.id}`}>Sprint</InputLabel>
                    <Select
                      labelId={`sprint-select-${item.id}`}
                      value={item.sprint_id || ''}
                      label="Sprint"
                      onChange={(event) => handleAssignToSprint(item.id, event.target.value)}
                    >
                      <MenuItem value="">Backlog</MenuItem>
                      {sprints.map((sprint) => (
                        <MenuItem key={sprint.id} value={sprint.id}>{sprint.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                <IconButton aria-label={`Mais ações para ${item.title}`}>
                  <MoreHorizIcon />
                </IconButton>
              </Stack>
            </Stack>

            {renderWorkloadPreview(item)}

            <Divider />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  variant="contained"
                  startIcon={<TaskAltOutlinedIcon />}
                  onClick={() => openTaskDialog(item)}
                >
                  Criar tarefa
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AssignmentOutlinedIcon />}
                  onClick={() => openWorkPackageDialog(item)}
                >
                  Pacote de trabalho
                </Button>
              </Stack>
              <Button
                variant="text"
                onClick={() => {
                  setSelectedBacklogItem(item);
                  setBacklogForm({
                    title: item.title,
                    description: item.description || '',
                    story_points: item.story_points || 3,
                    priority: item.priority || 'Should',
                    definition_of_done: item.definition_of_done || '',
                    sprint_id: item.sprint_id || '',
                  });
                  setBacklogDialogOpen(true);
                }}
              >
                Editar item
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  const getSprintSummary = (sprintItems) => {
    const sprintTasks = sprintItems.flatMap((item) => getItemTasks(item.id));
    const sprintPackages = sprintItems.flatMap((item) => getItemWorkPackages(item.id));
    const estimatedHours = [...sprintTasks, ...sprintPackages].reduce(
      (total, item) => total + Number(item.estimated_hours || 0),
      0
    );

    return {
      totalItems: sprintItems.length,
      totalTasks: sprintTasks.length,
      totalPackages: sprintPackages.length,
      estimatedHours,
    };
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
      <Stack spacing={3}>
        <ProjectPageHeader
          projectId={projectId}
          current="backlog"
          eyebrow="Planeamento"
          titleOverride="Backlog"
          subtitle="Planeia sprints, descreve o que precisa de ser feito, acompanha Definition of Done e organiza tarefas e pacotes de trabalho."
          actions={canPlan ? (
            <Stack direction="row" spacing={1.5}>
              <Button variant="outlined" startIcon={<CalendarMonthOutlinedIcon />} onClick={() => { setFormError(''); setSprintDialogOpen(true); }}>
                Criar sprint
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => openCreateBacklogDialog()}>
                Criar item
              </Button>
            </Stack>
          ) : null}
        />

        {backlogError && <Alert severity="error">{backlogError.message || 'Erro ao carregar backlog.'}</Alert>}

        <Card variant="outlined" sx={cardShellSx}>
          <Box sx={topAccent('#182439')} aria-hidden="true" />
          <CardContent sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ xs: 'stretch', lg: 'center' }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 220 }}>
                <FilterListOutlinedIcon color="primary" />
                <Typography variant="h6" fontWeight={800}>Filtrar backlog</Typography>
              </Stack>
              <TextField
                label="Pesquisar item"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Título, descrição, Definition of Done..."
                fullWidth
              />
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel id="priority-filter-label">Prioridade</InputLabel>
                <Select
                  labelId="priority-filter-label"
                  value={priorityFilter}
                  label="Prioridade"
                  onChange={(event) => setPriorityFilter(event.target.value)}
                >
                  <MenuItem value="all">Todas</MenuItem>
                  {priorityOptions.map((priority) => (
                    <MenuItem key={priority.value} value={priority.label}>{priority.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 220 }}>
                <InputLabel id="workload-filter-label">Trabalho associado</InputLabel>
                <Select
                  labelId="workload-filter-label"
                  value={workloadFilter}
                  label="Trabalho associado"
                  onChange={(event) => setWorkloadFilter(event.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="with-work">Com trabalho</MenuItem>
                  <MenuItem value="without-work">Sem trabalho</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 220 }}>
                <InputLabel id="assignee-filter-label">Responsável</InputLabel>
                <Select
                  labelId="assignee-filter-label"
                  value={assigneeFilter}
                  label="Responsável"
                  onChange={(event) => setAssigneeFilter(event.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {assigneeOptions.map((assignee) => (
                    <MenuItem key={assignee.id} value={assignee.id}>{assignee.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 220 }}>
                <InputLabel id="work-type-filter-label">Tipo de trabalho</InputLabel>
                <Select
                  labelId="work-type-filter-label"
                  value={workTypeFilter}
                  label="Tipo de trabalho"
                  onChange={(event) => setWorkTypeFilter(event.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {workTypeOptions.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>

        <DragDropContext onDragEnd={handleDragEnd}>
        <Card variant="outlined" sx={{ ...cardShellSx, backgroundColor: '#EAF8FF' }}>
          <Box sx={topAccent('#56B5E8')} aria-hidden="true" />
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <PlaylistAddCheckCircleOutlinedIcon color="primary" />
                  <Box>
                    <Typography variant="h5" fontWeight={800}>Planeamento de sprint</Typography>
                    <Typography color="text.secondary">
                      Organiza o trabalho comprometido, adiciona datas e prepara o sprint antes de o arrancar.
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Chip label={`${groupedBacklog.sprint.length} work items`} />
                  {canPlan && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => openCreateBacklogDialog()}
                    >
                      Criar backlog item
                    </Button>
                  )}
                </Stack>
              </Stack>

              {sprints.length === 0 ? (
                <Box sx={{ border: '1px dashed #A7D7F0', borderRadius: 3, p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>Plan your sprint</Typography>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    Cria um sprint, adiciona datas e depois associa backlog items para planeares o trabalho da equipa.
                  </Typography>
                  {canPlan && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
                      <Button variant="contained" onClick={() => setSprintDialogOpen(true)}>
                        Criar sprint
                      </Button>
                      <Button variant="outlined" startIcon={<AddIcon />} onClick={() => openCreateBacklogDialog()}>
                        Criar backlog item
                      </Button>
                    </Stack>
                  )}
                </Box>
              ) : (
                <Stack spacing={2}>
                  {sprints.map((sprint) => {
                    const sprintItems = groupedBacklog.sprint.filter((item) => Number(item.sprint_id) === Number(sprint.id));
                    const sprintStatus = sprintTone[sprint.status] || sprintTone.planned;
                    const sprintSummary = getSprintSummary(sprintItems);
                    const canStartSprint = canPlan && sprint.status !== 'active' && sprint.status !== 'completed';

                    return (
                      <Box key={sprint.id} sx={{ border: '1px solid #B7DDF2', borderRadius: 3, p: 2.5, backgroundColor: '#DDF4FF' }}>
                        <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" spacing={2}>
                          <Stack spacing={1.5} sx={{ flex: 1 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                              <Typography variant="h6" fontWeight={800}>{sprint.name}</Typography>
                              <Chip label={`${sprintItems.length} work items`} size="small" />
                              <Chip
                                label={sprintStatus.label}
                                size="small"
                                sx={{ fontWeight: 700, color: sprintStatus.color, backgroundColor: sprintStatus.backgroundColor }}
                              />
                              <Chip label={`${sprintSummary.totalTasks} tarefas`} size="small" />
                              <Chip label={`${sprintSummary.totalPackages} pacotes`} size="small" />
                              <Chip label={`${sprintSummary.estimatedHours.toFixed(1)} h`} size="small" />
                              {canPlan && (
                                <Button
                                  variant="text"
                                  size="small"
                                  startIcon={<AddIcon />}
                                  onClick={() => openCreateBacklogDialog(sprint.id)}
                                >
                                  Criar backlog item
                                </Button>
                              )}
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              {sprint.status === 'active'
                                ? 'Sprint em execução. O trabalho comprometido já está visível para a equipa.'
                                : 'Define datas, adiciona trabalho e arranca o sprint quando estiver pronto.'}
                            </Typography>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                              <TextField
                                label="Data de início"
                                type="date"
                                value={sprint.start_date ? String(sprint.start_date).split('T')[0] : ''}
                                onChange={(event) => dispatch(updateSprint({
                                  id: sprint.id,
                                  name: sprint.name,
                                  status: sprint.status || 'planned',
                                  start_date: event.target.value,
                                  end_date: sprint.end_date,
                                  project_id: projectId,
                                }))}
                                slotProps={{ inputLabel: { shrink: true } }}
                                fullWidth
                              />
                              <TextField
                                label="Data de fim"
                                type="date"
                                value={sprint.end_date ? String(sprint.end_date).split('T')[0] : ''}
                                onChange={(event) => dispatch(updateSprint({
                                  id: sprint.id,
                                  name: sprint.name,
                                  status: sprint.status || 'planned',
                                  start_date: sprint.start_date,
                                  end_date: event.target.value,
                                  project_id: projectId,
                                }))}
                                slotProps={{ inputLabel: { shrink: true } }}
                                fullWidth
                              />
                              <Button variant="outlined" onClick={() => handleUpdateSprintDates(sprint)}>
                                Guardar datas
                              </Button>
                              {canStartSprint && (
                                <Button
                                  variant="contained"
                                  onClick={() => handleStartSprint(sprint)}
                                  disabled={!sprint.start_date || !sprint.end_date || sprintItems.length === 0}
                                >
                                  {sprint.status === 'cancelled' ? 'Reativar sprint' : 'Start sprint'}
                                </Button>
                              )}
                            </Stack>
                          </Stack>
                        </Stack>
                        <Droppable droppableId={`sprint-${sprint.id}`}>
                          {(provided) => (
                            <Stack
                              spacing={2}
                              mt={2.5}
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              sx={{ minHeight: 90 }}
                            >
                              {sprintItems.length === 0 && (
                                <Box sx={{ border: '1px dashed #A7D7F0', borderRadius: 3, p: 3, textAlign: 'center' }}>
                                  <Typography color="text.secondary">
                                    Arrasta backlog items para este sprint ou usa o seletor em cada cartão.
                                  </Typography>
                                </Box>
                              )}
                              {sprintItems.map((item, index) => (
                                <Draggable key={`backlog-${item.id}`} draggableId={`backlog-${item.id}`} index={index}>
                                  {(dragProvided) => renderBacklogCard(item, '#56B5E8', dragProvided)}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </Stack>
                          )}
                        </Droppable>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ ...cardShellSx, backgroundColor: '#EAF8FF' }}>
          <Box sx={topAccent('#034AD8')} aria-hidden="true" />
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <TaskAltOutlinedIcon color="primary" />
                  <Box>
                    <Typography variant="h5" fontWeight={800}>Backlog</Typography>
                    <Typography color="text.secondary">
                      Lista de trabalho por planear, com paginação, Definition of Done, responsáveis e contagem de trabalhos por item.
                    </Typography>
                  </Box>
                </Stack>
                <Chip label={`${groupedBacklog.backlog.length} work items`} />
              </Stack>

              <Droppable droppableId="backlog-dropzone">
                {(provided) => (
                  <Stack spacing={2} ref={provided.innerRef} {...provided.droppableProps} sx={{ minHeight: 90 }}>
                    {pagedBacklog.length === 0 ? (
                      <Box sx={{ border: '1px dashed #A7D7F0', borderRadius: 3, p: 3, textAlign: 'center' }}>
                        <Typography color="text.secondary">O backlog está vazio para os filtros atuais.</Typography>
                        {canPlan && (
                          <Button sx={{ mt: 2 }} variant="contained" onClick={() => openCreateBacklogDialog()}>
                            Criar primeiro item
                          </Button>
                        )}
                      </Box>
                    ) : (
                      pagedBacklog.map((item, index) => (
                        <Draggable key={`backlog-${item.id}`} draggableId={`backlog-${item.id}`} index={index}>
                          {(dragProvided) => renderBacklogCard(item, '#034AD8', dragProvided)}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </Stack>
                )}
              </Droppable>

              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2}>
                <Typography color="text.secondary">
                  {groupedBacklog.backlog.length} itens visíveis no backlog geral
                </Typography>
                <Pagination
                  count={backlogPageCount}
                  page={page}
                  onChange={(_, nextPage) => setPage(nextPage)}
                  color="primary"
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>
        </DragDropContext>
      </Stack>

      <Dialog open={backlogDialogOpen} onClose={() => { setBacklogDialogOpen(false); setSelectedBacklogItem(null); setBacklogForm(emptyBacklogForm); }} fullWidth maxWidth="md">
        <DialogTitle>{selectedBacklogItem ? 'Editar backlog item' : 'Criar backlog item'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Título"
              fullWidth
              value={backlogForm.title}
              onChange={(event) => setBacklogForm({ ...backlogForm, title: event.target.value })}
            />
            <TextField
              label="Descrição"
              fullWidth
              multiline
              rows={3}
              value={backlogForm.description}
              onChange={(event) => setBacklogForm({ ...backlogForm, description: event.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="story-points-label">Story points</InputLabel>
                  <Select
                    labelId="story-points-label"
                    value={backlogForm.story_points}
                    label="Story points"
                    onChange={(event) => setBacklogForm({ ...backlogForm, story_points: event.target.value })}
                  >
                    {storyPointOptions.map((points) => (
                      <MenuItem key={points} value={points}>{points}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="priority-backlog-label">Prioridade</InputLabel>
                  <Select
                    labelId="priority-backlog-label"
                    value={backlogForm.priority}
                    label="Prioridade"
                    onChange={(event) => setBacklogForm({ ...backlogForm, priority: event.target.value })}
                  >
                    {priorityOptions.map((priority) => (
                      <MenuItem key={priority.value} value={priority.value}>{priority.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="sprint-backlog-label">Sprint</InputLabel>
                  <Select
                    labelId="sprint-backlog-label"
                    value={backlogForm.sprint_id}
                    label="Sprint"
                    onChange={(event) => setBacklogForm({ ...backlogForm, sprint_id: event.target.value })}
                  >
                    <MenuItem value="">Backlog</MenuItem>
                    {sprints.map((sprint) => (
                      <MenuItem key={sprint.id} value={sprint.id}>{sprint.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField
              label="Definition of Done"
              fullWidth
              multiline
              rows={3}
              value={backlogForm.definition_of_done}
              onChange={(event) => setBacklogForm({ ...backlogForm, definition_of_done: event.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setBacklogDialogOpen(false); setSelectedBacklogItem(null); setBacklogForm(emptyBacklogForm); }}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (selectedBacklogItem) {
                const result = await dispatch(updateBacklogItem({
                  id: selectedBacklogItem.id,
                  ...selectedBacklogItem,
                  ...backlogForm,
                  sprint_id: backlogForm.sprint_id || null,
                }));
                if (result.meta.requestStatus === 'fulfilled') {
                  setBacklogDialogOpen(false);
                  setSelectedBacklogItem(null);
                  setBacklogForm(emptyBacklogForm);
                  setFormError('');
                  refreshData();
                } else {
                  setFormError(result.payload?.message || 'Não foi possível atualizar o backlog item.');
                }
              } else {
                handleCreateBacklogItem();
              }
            }}
          >
            {selectedBacklogItem ? 'Guardar alterações' : 'Criar item'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={sprintDialogOpen} onClose={() => setSprintDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Criar sprint</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Nome"
              fullWidth
              value={sprintForm.name}
              onChange={(event) => setSprintForm({ ...sprintForm, name: event.target.value })}
            />
            <TextField
              label="Data de início"
              type="date"
              fullWidth
              value={sprintForm.start_date}
              onChange={(event) => setSprintForm({ ...sprintForm, start_date: event.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Data de fim"
              type="date"
              fullWidth
              value={sprintForm.end_date}
              onChange={(event) => setSprintForm({ ...sprintForm, end_date: event.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSprintDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateSprint}>Criar sprint</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Criar tarefa</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Título"
              fullWidth
              value={taskForm.title}
              onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
            />
            <TextField
              label="Descrição"
              fullWidth
              multiline
              rows={3}
              value={taskForm.description}
              onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="task-assignee-label">Atribuído a</InputLabel>
                  <Select
                    labelId="task-assignee-label"
                    value={taskForm.assigned_to}
                    label="Atribuído a"
                    onChange={(event) => setTaskForm({ ...taskForm, assigned_to: event.target.value })}
                  >
                    <MenuItem value="">Sem responsável</MenuItem>
                    {assignableUsers.map((assignee) => (
                      <MenuItem key={assignee.id} value={assignee.id}>{assignee.username}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="task-priority-label">Prioridade</InputLabel>
                  <Select
                    labelId="task-priority-label"
                    value={taskForm.priority}
                    label="Prioridade"
                    onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value })}
                  >
                    {priorityOptions.map((priority) => (
                      <MenuItem key={priority.value} value={priority.label}>{priority.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Estimativa (horas)"
                  type="number"
                  fullWidth
                  value={taskForm.estimated_hours}
                  onChange={(event) => setTaskForm({ ...taskForm, estimated_hours: event.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="task-type-label">Tipo de trabalho</InputLabel>
                  <Select
                    labelId="task-type-label"
                    value={taskForm.work_type}
                    label="Tipo de trabalho"
                    onChange={(event) => setTaskForm({ ...taskForm, work_type: event.target.value })}
                  >
                    {metadata.workTypes.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Data início"
                  type="date"
                  fullWidth
                  value={taskForm.planned_start_date}
                  onChange={(event) => setTaskForm({ ...taskForm, planned_start_date: event.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Data fim"
                  type="date"
                  fullWidth
                  value={taskForm.planned_end_date}
                  onChange={(event) => setTaskForm({ ...taskForm, planned_end_date: event.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateTask}>Criar tarefa</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={workPackageDialogOpen} onClose={() => setWorkPackageDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Criar pacote de trabalho</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Título"
              fullWidth
              value={workPackageForm.title}
              onChange={(event) => setWorkPackageForm({ ...workPackageForm, title: event.target.value })}
            />
            <TextField
              label="Descrição"
              fullWidth
              multiline
              rows={3}
              value={workPackageForm.description}
              onChange={(event) => setWorkPackageForm({ ...workPackageForm, description: event.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="work-package-assignee-label">Atribuído a</InputLabel>
                  <Select
                    labelId="work-package-assignee-label"
                    value={workPackageForm.assignee_id}
                    label="Atribuído a"
                    onChange={(event) => setWorkPackageForm({ ...workPackageForm, assignee_id: event.target.value })}
                  >
                    <MenuItem value="">Sem responsável</MenuItem>
                    {assignableUsers.map((assignee) => (
                      <MenuItem key={assignee.id} value={assignee.id}>{assignee.username}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="work-package-priority-label">Prioridade</InputLabel>
                  <Select
                    labelId="work-package-priority-label"
                    value={workPackageForm.priority}
                    label="Prioridade"
                    onChange={(event) => setWorkPackageForm({ ...workPackageForm, priority: event.target.value })}
                  >
                    {priorityOptions.map((priority) => (
                      <MenuItem key={priority.value} value={priority.label}>{priority.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Estimativa (horas)"
                  type="number"
                  fullWidth
                  value={workPackageForm.estimated_hours}
                  onChange={(event) => setWorkPackageForm({ ...workPackageForm, estimated_hours: event.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="work-package-type-label">Tipo de trabalho</InputLabel>
                  <Select
                    labelId="work-package-type-label"
                    value={workPackageForm.work_type}
                    label="Tipo de trabalho"
                    onChange={(event) => setWorkPackageForm({ ...workPackageForm, work_type: event.target.value })}
                  >
                    {metadata.workTypes.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Data início"
                  type="date"
                  fullWidth
                  value={workPackageForm.planned_start_date}
                  onChange={(event) => setWorkPackageForm({ ...workPackageForm, planned_start_date: event.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Data fim"
                  type="date"
                  fullWidth
                  value={workPackageForm.planned_end_date}
                  onChange={(event) => setWorkPackageForm({ ...workPackageForm, planned_end_date: event.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>
            <TextField
              label="Critério de Definition of Done que ajuda a cumprir"
              fullWidth
              multiline
              rows={2}
              value={workPackageForm.done_criterion}
              onChange={(event) => setWorkPackageForm({ ...workPackageForm, done_criterion: event.target.value })}
            />
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>Tarefas do pacote</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Adiciona múltiplas tarefas e usa as setas para definir a ordem de execução.
                  </Typography>
                </Box>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddWorkPackageTask}>
                  Adicionar tarefa
                </Button>
              </Stack>
              {workPackageForm.tasks.length === 0 ? (
                <Box sx={{ border: '1px dashed #D0D5DD', borderRadius: 2, p: 2, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    Ainda não foram adicionadas tarefas a este pacote.
                  </Typography>
                </Box>
              ) : workPackageForm.tasks.map((task, index) => (
                <Card key={`package-task-${index}`} variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography fontWeight={700}>Tarefa {index + 1}</Typography>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton onClick={() => moveWorkPackageTask(index, -1)} disabled={index === 0}>
                            <ArrowUpwardOutlinedIcon />
                          </IconButton>
                          <IconButton onClick={() => moveWorkPackageTask(index, 1)} disabled={index === workPackageForm.tasks.length - 1}>
                            <ArrowDownwardOutlinedIcon />
                          </IconButton>
                          <IconButton onClick={() => handleRemoveWorkPackageTask(index)}>
                            <DeleteOutlineOutlinedIcon />
                          </IconButton>
                        </Stack>
                      </Stack>
                      <TextField
                        label="Título da tarefa"
                        fullWidth
                        value={task.title}
                        onChange={(event) => handleWorkPackageTaskChange(index, 'title', event.target.value)}
                      />
                      <TextField
                        label="Descrição"
                        fullWidth
                        multiline
                        rows={2}
                        value={task.description}
                        onChange={(event) => handleWorkPackageTaskChange(index, 'description', event.target.value)}
                      />
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <FormControl fullWidth>
                            <InputLabel id={`package-task-assignee-${index}`}>Atribuído a</InputLabel>
                            <Select
                              labelId={`package-task-assignee-${index}`}
                              value={task.assigned_to}
                              label="Atribuído a"
                              onChange={(event) => handleWorkPackageTaskChange(index, 'assigned_to', event.target.value)}
                            >
                              <MenuItem value="">Sem responsável</MenuItem>
                              {assignableUsers.map((assignee) => (
                                <MenuItem key={assignee.id} value={assignee.id}>{assignee.username}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <FormControl fullWidth>
                            <InputLabel id={`package-task-priority-${index}`}>Prioridade</InputLabel>
                            <Select
                              labelId={`package-task-priority-${index}`}
                              value={task.priority}
                              label="Prioridade"
                              onChange={(event) => handleWorkPackageTaskChange(index, 'priority', event.target.value)}
                            >
                              {priorityOptions.map((priority) => (
                                <MenuItem key={`${priority.label}-${index}`} value={priority.label}>{priority.label}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            label="Estimativa (horas)"
                            type="number"
                            fullWidth
                            value={task.estimated_hours}
                            onChange={(event) => handleWorkPackageTaskChange(index, 'estimated_hours', event.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <FormControl fullWidth>
                            <InputLabel id={`package-task-type-${index}`}>Tipo de trabalho</InputLabel>
                            <Select
                              labelId={`package-task-type-${index}`}
                              value={task.work_type}
                              label="Tipo de trabalho"
                              onChange={(event) => handleWorkPackageTaskChange(index, 'work_type', event.target.value)}
                            >
                              {metadata.workTypes.map((type) => (
                                <MenuItem key={`${type}-${index}`} value={type}>{type}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            label="Data início"
                            type="date"
                            fullWidth
                            value={task.planned_start_date}
                            onChange={(event) => handleWorkPackageTaskChange(index, 'planned_start_date', event.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            label="Data fim"
                            type="date"
                            fullWidth
                            value={task.planned_end_date}
                            onChange={(event) => handleWorkPackageTaskChange(index, 'planned_end_date', event.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkPackageDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateWorkPackage}>Criar pacote</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Backlog;
