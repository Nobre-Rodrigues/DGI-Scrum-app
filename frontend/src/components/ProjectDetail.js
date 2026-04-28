import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects, setCurrentProject, updateProject } from '../features/project/projectSlice';
import { createSprint, fetchSprints, updateSprint } from '../features/sprint/sprintSlice';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ProjectDashboardSection from './projectDashboard/ProjectDashboardSection';
import ProjectPageHeader from './ProjectPageHeader';

const emptyProjectForm = {
  name: '',
  description: '',
  start_date: '',
  end_date: '',
};

const emptySprintForm = {
  name: '',
  start_date: '',
  end_date: '',
  status: 'planned',
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

const toInputDate = (value) => {
  const date = parseDateValue(value);

  if (!date) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
  const date = parseDateValue(value);

  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR').format(date);
};

const ProjectDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const projectId = Number(id);
  const { projects } = useSelector((state) => state.project);
  const { sprints } = useSelector((state) => state.sprint);
  const { user } = useSelector((state) => state.auth);
  const project = useMemo(() => projects.find((p) => p.id === projectId), [projects, projectId]);
  const [editOpen, setEditOpen] = useState(false);
  const [sprintOpen, setSprintOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [projectError, setProjectError] = useState('');
  const [sprintError, setSprintError] = useState('');
  const [editData, setEditData] = useState(emptyProjectForm);
  const [sprintData, setSprintData] = useState(emptySprintForm);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchSprints(projectId));
  }, [dispatch, projectId]);

  useEffect(() => {
    if (project) {
      dispatch(setCurrentProject(project));
      setEditData({
        name: project.name || '',
        description: project.description || '',
        start_date: toInputDate(project.start_date),
        end_date: toInputDate(project.end_date),
      });
    }
  }, [project, dispatch]);

  const isProductOwner = user?.role === 'Product Owner';
  const isScrumMaster = user?.role === 'Scrum Master';

  const handleProjectDialogClose = () => {
    setEditOpen(false);
    setProjectError('');
    if (project) {
      setEditData({
        name: project.name || '',
        description: project.description || '',
        start_date: toInputDate(project.start_date),
        end_date: toInputDate(project.end_date),
      });
    }
  };

  const handleSprintDialogClose = () => {
    setSprintOpen(false);
    setEditingSprint(null);
    setSprintError('');
    setSprintData(emptySprintForm);
  };

  const handleUpdateProject = () => {
    if (editData.start_date && editData.end_date && editData.start_date > editData.end_date) {
      setProjectError('A data de inicio nao pode ser maior que a data final.');
      return;
    }

    dispatch(updateProject({
      id: project.id,
      ...editData,
      start_date: editData.start_date || null,
      end_date: editData.end_date || null,
    }));
    setEditOpen(false);
    setProjectError('');
  };

  const handleOpenSprintCreate = () => {
    setEditingSprint(null);
    setSprintData(emptySprintForm);
    setSprintError('');
    setSprintOpen(true);
  };

  const handleOpenSprintEdit = (sprint) => {
    setEditingSprint(sprint);
    setSprintData({
      name: sprint.name || '',
      start_date: toInputDate(sprint.start_date),
      end_date: toInputDate(sprint.end_date),
      status: sprint.status || 'planned',
    });
    setSprintError('');
    setSprintOpen(true);
  };

  const handleSaveSprint = () => {
    if (!sprintData.start_date || !sprintData.end_date) {
      setSprintError('Selecione a data de inicio e a data final do sprint.');
      return;
    }

    if (sprintData.start_date > sprintData.end_date) {
      setSprintError('A data de inicio nao pode ser maior que a data final.');
      return;
    }

    const payload = {
      ...sprintData,
      project_id: projectId,
    };

    if (editingSprint) {
      dispatch(updateSprint({ id: editingSprint.id, ...payload }));
    } else {
      dispatch(createSprint(payload));
    }

    handleSprintDialogClose();
  };

  if (!project) return <Typography>Loading...</Typography>;

  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        <ProjectPageHeader
          projectId={id}
          current="summary"
          eyebrow="Workspace do Projeto"
          actions={isProductOwner ? (
            <Button variant="outlined" onClick={() => setEditOpen(true)}>
              Editar projeto
            </Button>
          ) : null}
        />

        <ProjectDashboardSection projectId={projectId} />

        <Card variant="outlined">
          <CardContent>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              mb={2}
            >
              <Box>
                <Typography variant="h5">Sprints</Typography>
                <Typography variant="body2" color="text.secondary">
                  Selecione periodo de inicio e fim para planejar cada sprint.
                </Typography>
              </Box>
              {isScrumMaster && (
                <Button variant="contained" onClick={handleOpenSprintCreate}>
                  Novo sprint
                </Button>
              )}
            </Stack>

            <Stack spacing={2}>
              {sprints.length === 0 && (
                <Typography color="text.secondary">
                  Nenhum sprint cadastrado para este projeto.
                </Typography>
              )}

              {sprints.map((sprint) => (
                <Card key={sprint.id} variant="outlined">
                  <CardContent>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={2}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', md: 'center' }}
                    >
                      <Box>
                        <Typography variant="h6">{sprint.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Status: {sprint.status || 'planned'}
                        </Typography>
                      </Box>
                      {isScrumMaster && (
                        <Button variant="outlined" onClick={() => handleOpenSprintEdit(sprint)}>
                          Editar sprint
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Dialog open={editOpen} onClose={handleProjectDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>Editar projeto</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {projectError && <Alert severity="error">{projectError}</Alert>}
            <TextField
              label="Nome"
              fullWidth
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            />
            <TextField
              label="Descricao"
              fullWidth
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              multiline
              rows={3}
            />
            <TextField
              label="Data de inicio"
              type="date"
              fullWidth
              value={editData.start_date}
              onChange={(e) => setEditData({ ...editData, start_date: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Data de fim"
              type="date"
              fullWidth
              value={editData.end_date}
              onChange={(e) => setEditData({ ...editData, end_date: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleProjectDialogClose}>Cancelar</Button>
          <Button onClick={handleUpdateProject} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={sprintOpen} onClose={handleSprintDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>{editingSprint ? 'Editar sprint' : 'Novo sprint'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {sprintError && <Alert severity="error">{sprintError}</Alert>}
            <TextField
              label="Nome do sprint"
              fullWidth
              value={sprintData.name}
              onChange={(e) => setSprintData({ ...sprintData, name: e.target.value })}
            />
            <TextField
              label="Data de inicio"
              type="date"
              fullWidth
              value={sprintData.start_date}
              onChange={(e) => setSprintData({ ...sprintData, start_date: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Data de fim"
              type="date"
              fullWidth
              value={sprintData.end_date}
              onChange={(e) => setSprintData({ ...sprintData, end_date: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            {editingSprint && (
              <TextField
                label="Status"
                fullWidth
                value={sprintData.status}
                onChange={(e) => setSprintData({ ...sprintData, status: e.target.value })}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSprintDialogClose}>Cancelar</Button>
          <Button onClick={handleSaveSprint} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectDetail;
