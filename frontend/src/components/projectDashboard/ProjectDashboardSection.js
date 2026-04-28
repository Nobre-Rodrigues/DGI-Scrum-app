import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import PlaylistAddCheckCircleOutlinedIcon from '@mui/icons-material/PlaylistAddCheckCircleOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ProjectSummaryCard from './ProjectSummaryCard';
import {
  fetchProjectDashboard,
  updateProjectPriority,
  updateProjectStatus,
} from '../../features/projectDashboard/projectDashboardSlice';
import {
  archiveWorkItem,
  createWorkItem,
  deleteWorkItem,
  fetchWorkItemMetadata,
  fetchWorkItems,
  updateWorkItem,
} from '../../features/workItem/workItemSlice';
import { fetchBacklogItems, updateBacklogItem } from '../../features/backlog/backlogSlice';
import { fetchAssignableUsers } from '../../features/user/userSlice';

const emptyWorkItemForm = {
  backlog_item_id: '',
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
};

const toneMap = {
  positive: 'positive',
  negative: 'negative',
  neutral: 'neutral',
  disponível: 'positive',
  equilibrado: 'neutral',
  sobrecarregado: 'negative',
};

const formatDate = (value) => {
  if (!value) {
    return 'Sem data';
  }

  return new Intl.DateTimeFormat('pt-PT').format(new Date(value));
};

const ProjectDashboardSection = ({ projectId }) => {
  const dispatch = useDispatch();
  const { summary, isLoading, error, statusUpdateLoading, priorityUpdateLoading } = useSelector((state) => state.projectDashboard);
  const { items: workItems, metadata, isSaving: isSavingWorkItem, error: workItemError } = useSelector((state) => state.workItem);
  const { items: backlogItems } = useSelector((state) => state.backlog);
  const { assignableUsers } = useSelector((state) => state.user);
  const { user } = useSelector((state) => state.auth);

  const [detailsDialog, setDetailsDialog] = useState(null);
  const [workItemDialogOpen, setWorkItemDialogOpen] = useState(false);
  const [editingWorkItem, setEditingWorkItem] = useState(null);
  const [workItemForm, setWorkItemForm] = useState(emptyWorkItemForm);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    dispatch(fetchProjectDashboard(projectId));
    dispatch(fetchWorkItems(projectId));
    dispatch(fetchWorkItemMetadata());
    dispatch(fetchBacklogItems(projectId));
    dispatch(fetchAssignableUsers());
  }, [dispatch, projectId]);

  const canEditStatus = ['Product Owner', 'Scrum Master', 'Director'].includes(user?.role);

  const detailItems = useMemo(() => {
    if (!summary) {
      return [];
    }

    if (detailsDialog === 'updates') {
      return summary.metrics.updatesLast7Days.items;
    }

    if (detailsDialog === 'created') {
      return summary.metrics.tasksCreatedLast7Days.items;
    }

    if (detailsDialog === 'planned') {
      return summary.metrics.plannedNext7Days.items;
    }

    return [];
  }, [detailsDialog, summary]);

  const handleOpenCreateWorkItem = () => {
    setEditingWorkItem(null);
    setWorkItemForm({
      ...emptyWorkItemForm,
      work_type: metadata.workTypes[0] || 'Análise',
      priority: metadata.priorities[2] || 'Média',
      status: metadata.statuses[0] || 'Não iniciado',
    });
    setFormError('');
    setWorkItemDialogOpen(true);
  };

  const handleOpenEditWorkItem = (item) => {
    setEditingWorkItem(item);
    setWorkItemForm({
      backlog_item_id: item.backlog_item_id || '',
      title: item.title || '',
      description: item.description || '',
      assignee_id: item.assignee_id || '',
      status: item.status || 'Não iniciado',
      priority: item.priority || 'Média',
      work_type: item.work_type || metadata.workTypes[0] || 'Análise',
      estimated_hours: item.estimated_hours || '',
      planned_start_date: item.planned_start_date ? String(item.planned_start_date).split('T')[0] : '',
      planned_end_date: item.planned_end_date ? String(item.planned_end_date).split('T')[0] : '',
      done_criterion: item.done_criterion || '',
    });
    setFormError('');
    setWorkItemDialogOpen(true);
  };

  const refreshDashboard = () => {
    dispatch(fetchProjectDashboard(projectId));
    dispatch(fetchWorkItems(projectId));
  };

  const handleSaveWorkItem = async () => {
    if (!workItemForm.title || !workItemForm.work_type || !workItemForm.priority) {
      setFormError('Preencha os campos obrigatórios do item de trabalho.');
      return;
    }

    const payload = {
      ...workItemForm,
      project_id: projectId,
      backlog_item_id: workItemForm.backlog_item_id || null,
      assignee_id: workItemForm.assignee_id || null,
      estimated_hours: workItemForm.estimated_hours || null,
      planned_start_date: workItemForm.planned_start_date || null,
      planned_end_date: workItemForm.planned_end_date || null,
    };

    const action = editingWorkItem
      ? updateWorkItem({ id: editingWorkItem.id, ...payload })
      : createWorkItem(payload);

    const result = await dispatch(action);

    if (result.meta.requestStatus === 'fulfilled') {
      setWorkItemDialogOpen(false);
      setEditingWorkItem(null);
      setWorkItemForm(emptyWorkItemForm);
      refreshDashboard();
    } else {
      setFormError(result.payload?.message || 'Não foi possível guardar o item de trabalho.');
    }
  };

  const handleDeleteWorkItem = async (id) => {
    const result = await dispatch(deleteWorkItem(id));
    if (result.meta.requestStatus === 'fulfilled') {
      refreshDashboard();
    }
  };

  const handleArchiveWorkItem = async (id) => {
    const result = await dispatch(archiveWorkItem(id));
    if (result.meta.requestStatus === 'fulfilled') {
      refreshDashboard();
    }
  };

  const handlePriorityChange = async (item, priority) => {
    if (item.entityType === 'backlog') {
      const originalItem = backlogItems.find((backlogItem) => backlogItem.id === item.id);
      if (!originalItem) {
        return;
      }

      const result = await dispatch(updateBacklogItem({ ...originalItem, priority }));
      if (result.meta.requestStatus === 'fulfilled') {
        await dispatch(updateProjectPriority({ projectId, entityType: 'backlog', entityId: item.id, priority }));
        refreshDashboard();
      }
      return;
    }

    const workItem = workItems.find((currentItem) => currentItem.id === item.id);
    if (!workItem) {
      return;
    }

    const result = await dispatch(updateWorkItem({ ...workItem, priority }));
    if (result.meta.requestStatus === 'fulfilled') {
      await dispatch(updateProjectPriority({ projectId, entityType: 'work-item', entityId: item.id, priority }));
      refreshDashboard();
    }
  };

  const handleStatusChange = async (status) => {
    const result = await dispatch(updateProjectStatus({ projectId, status }));
    if (result.meta.requestStatus === 'fulfilled') {
      refreshDashboard();
    }
  };

  if (isLoading && !summary) {
    return <Typography>Loading project dashboard...</Typography>;
  }

  if (error) {
    return <Alert severity="error">{error.message || 'Erro ao carregar dashboard do projeto.'}</Alert>;
  }

  if (!summary) {
    return null;
  }

  const metricCards = [
    {
      key: 'progress',
      title: 'Progresso nos últimos 7 dias',
      icon: <InsightsOutlinedIcon color="primary" />,
      primaryValue: `${summary.metrics.progressLast7Days.currentPercentage}%`,
      subtitle: `Incremento de ${summary.metrics.progressLast7Days.delta}% face a há 7 dias`,
      trendLabel: summary.metrics.progressLast7Days.trend === 'positive'
        ? 'Evolução positiva'
        : summary.metrics.progressLast7Days.trend === 'negative'
          ? 'Atenção ao ritmo'
          : 'Sem alteração',
      tone: summary.metrics.progressLast7Days.trend,
    },
    {
      key: 'updates',
      title: 'Atualizações nos últimos 7 dias',
      icon: <HistoryEduOutlinedIcon color="primary" />,
      primaryValue: summary.metrics.updatesLast7Days.count,
      subtitle: 'Registos relevantes de backlog, tarefas e itens de trabalho',
      actionLabel: 'Ver detalhe',
      onAction: () => setDetailsDialog('updates'),
    },
    {
      key: 'created',
      title: 'Tarefas criadas nos últimos 7 dias',
      icon: <PlaylistAddCheckCircleOutlinedIcon color="primary" />,
      primaryValue: summary.metrics.tasksCreatedLast7Days.count,
      subtitle: 'Novas tarefas registadas no período recente',
      actionLabel: 'Ver detalhe',
      onAction: () => setDetailsDialog('created'),
    },
    {
      key: 'planned',
      title: 'Planeado para os próximos 7 dias',
      icon: <EventAvailableOutlinedIcon color="primary" />,
      primaryValue: summary.metrics.plannedNext7Days.count,
      subtitle: 'Trabalho com datas previstas de início ou fim na próxima semana',
      actionLabel: 'Ver detalhe',
      onAction: () => setDetailsDialog('planned'),
    },
  ];

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        {metricCards.map((card) => (
          <Grid item xs={12} md={6} key={card.key}>
            <ProjectSummaryCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ProjectSummaryCard
            title="Estado do projeto"
            icon={<TaskAltOutlinedIcon color="primary" />}
            primaryValue={summary.state.status}
            subtitle={`${summary.state.completedWorkItems} de ${summary.state.totalWorkItems} itens concluídos`}
            tone={summary.state.status === 'Em risco' || summary.state.status === 'Bloqueado' ? 'negative' : 'info'}
            minHeight={250}
          >
            <Stack spacing={2}>
              <Chip
                label={summary.state.status}
                sx={{
                  alignSelf: 'flex-start',
                  fontWeight: 700,
                  backgroundColor: '#E9EEF6',
                  color: '#182439',
                }}
              />
              {canEditStatus && (
                <FormControl fullWidth>
                  <InputLabel id="project-status-label">Estado</InputLabel>
                  <Select
                    labelId="project-status-label"
                    value={summary.state.status}
                    label="Estado"
                    onChange={(event) => handleStatusChange(event.target.value)}
                    disabled={statusUpdateLoading}
                  >
                    {['Não iniciado', 'Em curso', 'Em risco', 'Bloqueado', 'Concluído'].map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
          </ProjectSummaryCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <ProjectSummaryCard
            title="Itens de trabalho para Definition of Done"
            icon={<TaskAltOutlinedIcon color="primary" />}
            primaryValue={summary.workItems.count}
            subtitle="Itens de trabalho associados a backlog e critérios de Definition of Done"
            actionLabel="Adicionar item"
            onAction={handleOpenCreateWorkItem}
            minHeight={250}
          >
            <Stack spacing={1.5}>
              {workItems.slice(0, 4).map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    border: '1px solid #D0D5DD',
                    borderRadius: 2,
                    p: 1.5,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Box>
                      <Typography fontWeight={700}>{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.backlog_title || 'Sem backlog associado'} · {item.done_criterion || 'Sem critério definido'}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => handleOpenEditWorkItem(item)}>Editar</Button>
                      <Button size="small" color="warning" onClick={() => handleArchiveWorkItem(item.id)}>Arquivar</Button>
                      <Button size="small" color="error" onClick={() => handleDeleteWorkItem(item.id)}>Eliminar</Button>
                    </Stack>
                  </Stack>
                </Box>
              ))}
              {workItems.length === 0 && (
                <Typography color="text.secondary">
                  Ainda não existem itens de trabalho associados à Definition of Done.
                </Typography>
              )}
            </Stack>
          </ProjectSummaryCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <ProjectSummaryCard
            title="Gestão de prioridades"
            icon={<FlagOutlinedIcon color="primary" />}
            primaryValue={summary.priorities.items.length}
            subtitle="Prioridades dos itens de backlog e dos itens de trabalho"
            minHeight={320}
          >
            <Stack spacing={1.5}>
              {summary.priorities.items.slice(0, 6).map((item) => (
                <Stack
                  key={`${item.entityType}-${item.id}`}
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                >
                  <Box>
                    <Typography fontWeight={700}>{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.entityType === 'backlog' ? 'Backlog item' : 'Item de trabalho'}
                    </Typography>
                  </Box>
                  <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel id={`priority-${item.entityType}-${item.id}`}>Prioridade</InputLabel>
                    <Select
                      labelId={`priority-${item.entityType}-${item.id}`}
                      value={item.priority || 'Média'}
                      label="Prioridade"
                      onChange={(event) => handlePriorityChange(item, event.target.value)}
                      disabled={priorityUpdateLoading}
                    >
                      {metadata.priorities.map((priority) => (
                        <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              ))}
              {summary.priorities.items.length === 0 && (
                <Typography color="text.secondary">
                  Ainda não existem prioridades para gerir neste projeto.
                </Typography>
              )}
            </Stack>
          </ProjectSummaryCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <ProjectSummaryCard
            title="Tipos de trabalho"
            icon={<CategoryOutlinedIcon color="primary" />}
            primaryValue={summary.workTypes.availableTypes.length}
            subtitle="Distribuição do trabalho pelos tipos configurados no backend"
            minHeight={320}
          >
            <Stack spacing={1.2}>
              {summary.workTypes.breakdown.map((item) => (
                <Stack key={item.workType} direction="row" justifyContent="space-between" spacing={2}>
                  <Typography>{item.workType}</Typography>
                  <Chip label={`${item.count} itens`} size="small" />
                </Stack>
              ))}
            </Stack>
          </ProjectSummaryCard>
        </Grid>

        <Grid item xs={12}>
          <ProjectSummaryCard
            title="Capacidade de trabalho da equipa"
            icon={<GroupsOutlinedIcon color="primary" />}
            primaryValue={summary.teamCapacity.length}
            subtitle="Capacidade semanal disponível, atribuição atual e estado de carga por colaborador"
            minHeight={320}
          >
            {summary.teamCapacity.length > 0 ? (
              <TableContainer>
                <Table size="small" aria-label="Capacidade da equipa">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell>Função</TableCell>
                      <TableCell>Capacidade semanal</TableCell>
                      <TableCell>Trabalho atribuído</TableCell>
                      <TableCell>Ocupação</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.teamCapacity.map((member) => (
                      <TableRow key={member.userId}>
                        <TableCell>{member.name}</TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>{member.weeklyCapacityHours}h</TableCell>
                        <TableCell>{member.assignedEstimatedHours}h</TableCell>
                        <TableCell>{member.occupationPercentage}%</TableCell>
                        <TableCell>
                          <Chip
                            label={member.loadStatus}
                            size="small"
                            sx={{
                              color: toneMap[member.loadStatus] === 'negative' ? '#B42318' : toneMap[member.loadStatus] === 'positive' ? '#0F7B6C' : '#475467',
                              backgroundColor: toneMap[member.loadStatus] === 'negative' ? '#FEF3F2' : toneMap[member.loadStatus] === 'positive' ? '#ECFDF3' : '#F2F4F7',
                              fontWeight: 700,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary">
                Ainda não existem estimativas atribuídas suficientes para calcular a capacidade da equipa.
              </Typography>
            )}
          </ProjectSummaryCard>
        </Grid>
      </Grid>

      <Dialog open={Boolean(detailsDialog)} onClose={() => setDetailsDialog(null)} fullWidth maxWidth="md">
        <DialogTitle>
          {detailsDialog === 'updates' && 'Atualizações recentes'}
          {detailsDialog === 'created' && 'Tarefas criadas nos últimos 7 dias'}
          {detailsDialog === 'planned' && 'Trabalho planeado para os próximos 7 dias'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {detailItems.map((item) => (
              <Box key={item.id} sx={{ border: '1px solid #D0D5DD', borderRadius: 2, p: 2 }}>
                <Typography fontWeight={700}>{item.title || item.description}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.assignee_name || item.owner_name || item.changed_by_name || 'Sem responsável identificado'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {detailsDialog === 'updates'
                    ? formatDate(item.changed_at)
                    : detailsDialog === 'created'
                      ? `${formatDate(item.created_at)} · ${item.status || 'Sem estado'} · ${item.priority || 'Sem prioridade'}`
                      : `${formatDate(item.planned_start_date || item.planned_end_date)} · ${item.status || 'Sem estado'} · ${item.priority || 'Sem prioridade'}`}
                </Typography>
              </Box>
            ))}
            {detailItems.length === 0 && (
              <Typography color="text.secondary">
                Não existem registos para este período.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={workItemDialogOpen} onClose={() => setWorkItemDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editingWorkItem ? 'Editar item de trabalho' : 'Novo item de trabalho'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            {(formError || workItemError) && (
              <Alert severity="error">{formError || workItemError?.message || 'Erro ao guardar item de trabalho.'}</Alert>
            )}
            <TextField
              label="Título"
              value={workItemForm.title}
              onChange={(event) => setWorkItemForm({ ...workItemForm, title: event.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Descrição"
              value={workItemForm.description}
              onChange={(event) => setWorkItemForm({ ...workItemForm, description: event.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel id="backlog-item-label">Backlog item associado</InputLabel>
              <Select
                labelId="backlog-item-label"
                value={workItemForm.backlog_item_id}
                label="Backlog item associado"
                onChange={(event) => setWorkItemForm({ ...workItemForm, backlog_item_id: event.target.value })}
              >
                <MenuItem value="">Sem associação</MenuItem>
                {backlogItems.map((item) => (
                  <MenuItem key={item.id} value={item.id}>{item.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="assignee-label">Responsável</InputLabel>
                  <Select
                    labelId="assignee-label"
                    value={workItemForm.assignee_id}
                    label="Responsável"
                    onChange={(event) => setWorkItemForm({ ...workItemForm, assignee_id: event.target.value })}
                  >
                    <MenuItem value="">Sem responsável</MenuItem>
                    {assignableUsers.map((item) => (
                      <MenuItem key={item.id} value={item.id}>{item.username}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="status-label">Estado</InputLabel>
                  <Select
                    labelId="status-label"
                    value={workItemForm.status}
                    label="Estado"
                    onChange={(event) => setWorkItemForm({ ...workItemForm, status: event.target.value })}
                  >
                    {metadata.statuses.map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="priority-label">Prioridade</InputLabel>
                  <Select
                    labelId="priority-label"
                    value={workItemForm.priority}
                    label="Prioridade"
                    onChange={(event) => setWorkItemForm({ ...workItemForm, priority: event.target.value })}
                  >
                    {metadata.priorities.map((priority) => (
                      <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="work-type-label">Tipo de trabalho</InputLabel>
                  <Select
                    labelId="work-type-label"
                    value={workItemForm.work_type}
                    label="Tipo de trabalho"
                    onChange={(event) => setWorkItemForm({ ...workItemForm, work_type: event.target.value })}
                  >
                    {metadata.workTypes.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Estimativa (horas)"
                  type="number"
                  value={workItemForm.estimated_hours}
                  onChange={(event) => setWorkItemForm({ ...workItemForm, estimated_hours: event.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Data prevista de início"
                  type="date"
                  value={workItemForm.planned_start_date}
                  onChange={(event) => setWorkItemForm({ ...workItemForm, planned_start_date: event.target.value })}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Data prevista de fim"
                  type="date"
                  value={workItemForm.planned_end_date}
                  onChange={(event) => setWorkItemForm({ ...workItemForm, planned_end_date: event.target.value })}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>
            <TextField
              label="Critério da Definition of Done"
              value={workItemForm.done_criterion}
              onChange={(event) => setWorkItemForm({ ...workItemForm, done_criterion: event.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkItemDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveWorkItem} variant="contained" disabled={isSavingWorkItem}>
            {editingWorkItem ? 'Guardar alterações' : 'Criar item'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default ProjectDashboardSection;

