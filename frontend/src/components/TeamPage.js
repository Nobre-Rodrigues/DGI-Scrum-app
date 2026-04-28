import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  approveTeamAssignment,
  createTeamAssignment,
  fetchPendingTeamAssignments,
  fetchTeamAssignments,
  rejectTeamAssignment,
} from '../features/teamAssignment/teamAssignmentSlice';
import {
  createUser,
  fetchAssignableUsers,
  fetchUsers,
  patchUserStatus,
  updateUser,
} from '../features/user/userSlice';
import { fetchDivisions } from '../features/division/divisionSlice';
import { fetchRoles } from '../features/role/roleSlice';
import { fetchMyContext, fetchMyPermissions } from '../features/me/meSlice';
import { fetchProjects } from '../features/project/projectSlice';
import { usePermissions } from '../hooks/usePermissions';
import ProjectSummaryCard from './projectDashboard/ProjectSummaryCard';
import ProjectPageHeader from './ProjectPageHeader';
import TeamPageBanner from './team/TeamPageBanner';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import GroupWorkOutlinedIcon from '@mui/icons-material/GroupWorkOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

const approvalTone = {
  APPROVED: 'success',
  PENDING: 'warning',
  REJECTED: 'error',
  CANCELLED: 'default',
};

const emptyUserForm = {
  displayName: '',
  email: '',
  role: '',
  divisionId: '',
  jobTitle: '',
  isActive: true,
};

const emptyAssignmentForm = {
  contextType: 'DASHBOARD',
  contextId: '',
  userId: '',
  assignedRole: '',
  notes: '',
};

const TeamPage = ({ defaultContextType = 'DASHBOARD', fixedProjectContext = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: routeProjectId } = useParams();
  const projectId = fixedProjectContext ? Number(routeProjectId) : null;

  const { users, loading: usersLoading, error: userError, saving: userSaving } = useSelector((state) => state.user);
  const { items: divisions } = useSelector((state) => state.division);
  const { items: roles } = useSelector((state) => state.role);
  const { items: assignments, pending: pendingAssignments, loading: assignmentsLoading, error: assignmentError } = useSelector((state) => state.teamAssignment);
  const { projects } = useSelector((state) => state.project);
  const { context: meContext } = useSelector((state) => state.me);
  const { canAccessTeamArea, canApproveParticipation, canManageUsers, canNominateUser } = usePermissions();

  const [filters, setFilters] = useState({
    search: '',
    divisionId: 'all',
    role: 'all',
    status: 'all',
  });
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedPendingAssignment, setSelectedPendingAssignment] = useState(null);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [assignmentForm, setAssignmentForm] = useState({
    ...emptyAssignmentForm,
    contextType: fixedProjectContext ? 'PROJECT' : defaultContextType,
    contextId: fixedProjectContext ? Number(routeProjectId) : '',
  });
  const [rejectReason, setRejectReason] = useState('');
  const [feedback, setFeedback] = useState({ open: false, severity: 'success', message: '' });
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchAssignableUsers());
    dispatch(fetchDivisions());
    dispatch(fetchRoles());
    dispatch(fetchTeamAssignments(fixedProjectContext ? { contextType: 'PROJECT', contextId: Number(routeProjectId) } : {}));
    dispatch(fetchPendingTeamAssignments());
    dispatch(fetchMyContext());
    dispatch(fetchMyPermissions());
    dispatch(fetchProjects());
  }, [dispatch, fixedProjectContext, routeProjectId]);

  const filteredUsers = useMemo(() => users.filter((user) => {
    const normalizedSearch = filters.search.trim().toLowerCase();
    const matchesSearch = !normalizedSearch
      || [user.displayName, user.email, user.jobTitle].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
    const matchesDivision = filters.divisionId === 'all' || String(user.divisionId) === String(filters.divisionId);
    const matchesRole = filters.role === 'all' || user.role === filters.role;
    const matchesStatus = filters.status === 'all'
      || (filters.status === 'active' && user.isActive)
      || (filters.status === 'inactive' && !user.isActive);
    return matchesSearch && matchesDivision && matchesRole && matchesStatus;
  }), [users, filters]);

  const summary = useMemo(() => {
    const activeUsers = users.filter((user) => user.isActive).length;
    const approvedAssignments = assignments.filter((item) => item.approvalStatus === 'APPROVED').length;
    const usersByDivision = divisions.map((division) => ({
      name: division.name,
      count: users.filter((user) => Number(user.divisionId) === Number(division.id)).length,
    })).filter((item) => item.count > 0);

    return {
      totalUsers: users.length,
      activeUsers,
      pendingAssignments: pendingAssignments.length,
      approvedAssignments,
      usersByDivision,
    };
  }, [assignments, divisions, pendingAssignments.length, users]);

  const currentContextOptions = useMemo(() => {
    if (fixedProjectContext) {
      return projects.filter((project) => Number(project.id) === Number(projectId));
    }

    return projects;
  }, [fixedProjectContext, projectId, projects]);

  const contextTitle = fixedProjectContext ? 'Equipa do Projeto' : 'Equipa';
  const contextSubtitle = 'Gestão de utilizadores, funções, divisões e participações';

  const openCreateUser = () => {
    setEditingUser(null);
    setViewOnly(false);
    setUserForm(emptyUserForm);
    setValidationError('');
    setUserDialogOpen(true);
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setViewOnly(false);
    setUserForm({
      displayName: user.displayName || '',
      email: user.email || '',
      role: user.role || '',
      divisionId: user.divisionId || '',
      jobTitle: user.jobTitle || '',
      isActive: Boolean(user.isActive),
    });
    setValidationError('');
    setUserDialogOpen(true);
  };

  const openViewUser = (user) => {
    openEditUser(user);
    setViewOnly(true);
  };

  const openAssignmentDialog = (user = null) => {
    setAssignmentForm({
      ...emptyAssignmentForm,
      contextType: fixedProjectContext ? 'PROJECT' : defaultContextType,
      contextId: fixedProjectContext ? Number(routeProjectId) : '',
      userId: user?.id || '',
      assignedRole: user?.role || '',
    });
    setValidationError('');
    setAssignmentDialogOpen(true);
  };

  const validateUserForm = () => {
    if (!userForm.displayName.trim()) return 'O nome é obrigatório.';
    if (!userForm.email.trim()) return 'O email ou identificador é obrigatório.';
    if (!userForm.role) return 'A função é obrigatória.';
    if (!userForm.divisionId) return 'A divisão é obrigatória.';
    return null;
  };

  const handleSubmitUser = async () => {
    const errorMessage = validateUserForm();
    if (errorMessage) {
      setValidationError(errorMessage);
      return;
    }

    const action = editingUser
      ? updateUser({ id: editingUser.id, ...userForm, divisionId: Number(userForm.divisionId) })
      : createUser({ ...userForm, divisionId: Number(userForm.divisionId) });

    const result = await dispatch(action);
    if (result.meta.requestStatus === 'fulfilled') {
      setUserDialogOpen(false);
      setFeedback({ open: true, severity: 'success', message: editingUser ? 'Utilizador atualizado.' : 'Utilizador criado.' });
      dispatch(fetchUsers());
    } else {
      setValidationError(result.payload?.message || 'Não foi possível guardar o utilizador.');
    }
  };

  const handleToggleUserStatus = async (user) => {
    const result = await dispatch(patchUserStatus({ id: user.id, isActive: !user.isActive }));
    if (result.meta.requestStatus === 'fulfilled') {
      setFeedback({
        open: true,
        severity: 'success',
        message: user.isActive ? 'Utilizador inativado.' : 'Utilizador ativado.',
      });
    }
  };

  const handleSubmitAssignment = async () => {
    if (!assignmentForm.userId) {
      setValidationError('Selecione um utilizador.');
      return;
    }

    if (!assignmentForm.assignedRole) {
      setValidationError('Selecione a função no contexto.');
      return;
    }

    if (assignmentForm.contextType === 'PROJECT' && !assignmentForm.contextId) {
      setValidationError('Selecione o projeto.');
      return;
    }

    const payload = {
      ...assignmentForm,
      userId: Number(assignmentForm.userId),
      contextId: assignmentForm.contextType === 'PROJECT' ? Number(assignmentForm.contextId) : null,
    };

    const result = await dispatch(createTeamAssignment(payload));
    if (result.meta.requestStatus === 'fulfilled') {
      setAssignmentDialogOpen(false);
      setFeedback({
        open: true,
        severity: 'success',
        message: result.payload.approvalStatus === 'PENDING'
          ? 'Nomeação criada e pendente de autorização.'
          : 'Nomeação aprovada com sucesso.',
      });
      dispatch(fetchTeamAssignments(fixedProjectContext ? { contextType: 'PROJECT', contextId: Number(routeProjectId) } : {}));
      dispatch(fetchPendingTeamAssignments());
    } else {
      setValidationError(result.payload?.message || 'Não foi possível criar a nomeação.');
    }
  };

  const handleApprove = async (assignmentId) => {
    const result = await dispatch(approveTeamAssignment(assignmentId));
    if (result.meta.requestStatus === 'fulfilled') {
      setFeedback({ open: true, severity: 'success', message: 'Nomeação aprovada.' });
    }
  };

  const handleReject = async () => {
    const result = await dispatch(rejectTeamAssignment({ id: selectedPendingAssignment.id, rejectionReason: rejectReason }));
    if (result.meta.requestStatus === 'fulfilled') {
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedPendingAssignment(null);
      setFeedback({ open: true, severity: 'success', message: 'Nomeação rejeitada.' });
    } else {
      setValidationError(result.payload?.message || 'Não foi possível rejeitar a nomeação.');
    }
  };

  if (!canAccessTeamArea && meContext) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">Não tem permissões para aceder à área Equipa.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
      <Stack spacing={3}>
        {fixedProjectContext ? (
          <ProjectPageHeader
            projectId={projectId}
            current="team"
            eyebrow="Equipa"
            titleOverride={contextTitle}
            subtitle={contextSubtitle}
            actions={(
              <Stack direction="row" spacing={1.5}>
                {canNominateUser && (
                  <Button variant="outlined" onClick={() => openAssignmentDialog()}>
                    Nova nomeação
                  </Button>
                )}
                {canManageUsers && (
                  <Button variant="contained" onClick={openCreateUser}>
                    Adicionar utilizador
                  </Button>
                )}
              </Stack>
            )}
          />
        ) : (
          <TeamPageBanner
            onDashboardTeam={() => navigate('/')}
            onIntakeTeam={() => navigate('/intake/team')}
            onProjectsTeam={() => navigate('/projects/team')}
            onCreateUser={openCreateUser}
            onCreateAssignment={() => openAssignmentDialog()}
            canManageUsers={canManageUsers}
            canNominateUser={canNominateUser}
          />
        )}

        {(userError || assignmentError) && (
          <Alert severity="error">{userError?.message || assignmentError?.message || 'Erro ao carregar dados da equipa.'}</Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <ProjectSummaryCard
              title="Total de utilizadores"
              icon={<PeopleAltOutlinedIcon />}
              primaryValue={summary.totalUsers}
              subtitle="Utilizadores registados"
              minHeight={180}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <ProjectSummaryCard
              title="Utilizadores ativos"
              icon={<VerifiedUserOutlinedIcon />}
              primaryValue={summary.activeUsers}
              subtitle="Ativos no sistema"
              tone="positive"
              minHeight={180}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <ProjectSummaryCard
              title="Nomeações pendentes"
              icon={<PendingActionsOutlinedIcon />}
              primaryValue={summary.pendingAssignments}
              subtitle="Aguardam autorização"
              tone="neutral"
              minHeight={180}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <ProjectSummaryCard
              title="Participações aprovadas"
              icon={<GroupWorkOutlinedIcon />}
              primaryValue={summary.approvedAssignments}
              subtitle="Ativas e aprovadas"
              tone="info"
              minHeight={180}
            >
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {summary.usersByDivision.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">Sem divisões com utilizadores.</Typography>
                ) : (
                  summary.usersByDivision.map((division) => (
                    <Chip key={division.name} label={`${division.name}: ${division.count}`} size="small" />
                  ))
                )}
              </Stack>
            </ProjectSummaryCard>
          </Grid>
        </Grid>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={2.5}>
            <Typography variant="h6" fontWeight={800}>Filtros</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Pesquisar por nome/email"
                  value={filters.search}
                  onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="division-filter-label">Divisão</InputLabel>
                  <Select
                    labelId="division-filter-label"
                    value={filters.divisionId}
                    label="Divisão"
                    onChange={(event) => setFilters((current) => ({ ...current, divisionId: event.target.value }))}
                  >
                    <MenuItem value="all">Todas</MenuItem>
                    {divisions.map((division) => (
                      <MenuItem key={division.id} value={division.id}>{division.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="role-filter-label">Função</InputLabel>
                  <Select
                    labelId="role-filter-label"
                    value={filters.role}
                    label="Função"
                    onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}
                  >
                    <MenuItem value="all">Todas</MenuItem>
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.name}>{role.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="status-filter-label">Estado</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    value={filters.status}
                    label="Estado"
                    onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="active">Ativo</MenuItem>
                    <MenuItem value="inactive">Inativo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 3, pb: 1.5 }}>
            <Typography variant="h6" fontWeight={800}>Utilizadores</Typography>
          </Box>
          <TableContainer>
            <Table aria-label="Tabela de utilizadores">
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Função</TableCell>
                  <TableCell>Divisão</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!usersLoading && filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">Não existem utilizadores para os filtros atuais.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.displayName || user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{user.divisionName || 'Sem divisão'}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive ? 'Ativo' : 'Inativo'}
                          color={user.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" onClick={() => openViewUser(user)}>Ver</Button>
                          {canManageUsers && (
                            <Button size="small" onClick={() => openEditUser(user)}>Editar</Button>
                          )}
                          {canManageUsers && (
                            <Button size="small" onClick={() => handleToggleUserStatus(user)}>
                              {user.isActive ? 'Inativar' : 'Ativar'}
                            </Button>
                          )}
                          {canNominateUser && (
                            <Button size="small" variant="outlined" onClick={() => openAssignmentDialog(user)}>
                              Nomear
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={800}>Nomeações</Typography>
                {assignmentsLoading && <Typography color="text.secondary">A carregar nomeações...</Typography>}
                {!assignmentsLoading && assignments.length === 0 ? (
                  <Typography color="text.secondary">Ainda não existem nomeações para este contexto.</Typography>
                ) : (
                  assignments.slice(0, 8).map((assignment) => (
                    <Box key={assignment.id} sx={{ border: '1px solid #D0D5DD', borderRadius: 2, p: 2 }}>
                      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography fontWeight={700}>{assignment.userDisplayName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {assignment.contextType === 'PROJECT'
                              ? `${assignment.projectName || 'Projeto'} · ${assignment.assignedRole}`
                              : `${assignment.contextType} · ${assignment.assignedRole}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Pedido por {assignment.requestedByName} · {assignment.requestedByDivisionName || 'Sem divisão'}
                          </Typography>
                        </Box>
                        <Chip
                          label={assignment.approvalStatus}
                          color={approvalTone[assignment.approvalStatus] || 'default'}
                          size="small"
                        />
                      </Stack>
                    </Box>
                  ))
                )}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={800}>Aprovações pendentes</Typography>
                {!canApproveParticipation ? (
                  <Typography color="text.secondary">Não tem permissões para aprovar participações interdivisionais.</Typography>
                ) : pendingAssignments.length === 0 ? (
                  <Typography color="text.secondary">Não existem nomeações pendentes.</Typography>
                ) : (
                  pendingAssignments.map((assignment) => (
                    <Box key={assignment.id} sx={{ border: '1px solid #D0D5DD', borderRadius: 2, p: 2 }}>
                      <Stack spacing={1.25}>
                        <Typography fontWeight={700}>{assignment.userDisplayName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {assignment.divisionName} · solicitado por {assignment.requestedByName} ({assignment.requestedByDivisionName || 'Sem divisão'})
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {assignment.contextType === 'PROJECT'
                            ? `Projeto: ${assignment.projectName || assignment.contextId}`
                            : `Contexto: ${assignment.contextType}`}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Button variant="contained" size="small" onClick={() => handleApprove(assignment.id)}>
                            Aprovar
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              setSelectedPendingAssignment(assignment);
                              setRejectReason('');
                              setRejectDialogOpen(true);
                            }}
                          >
                            Rejeitar
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>
                  ))
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Stack>

      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{viewOnly ? 'Ver utilizador' : editingUser ? 'Editar utilizador' : 'Adicionar utilizador'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            {validationError && <Alert severity="error">{validationError}</Alert>}
            <TextField
              label="Nome"
              value={userForm.displayName}
              onChange={(event) => setUserForm((current) => ({ ...current, displayName: event.target.value }))}
              disabled={viewOnly}
              fullWidth
            />
            <TextField
              label="Email ou identificador"
              value={userForm.email}
              onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
              disabled={viewOnly}
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={viewOnly}>
                  <InputLabel id="user-role-label">Função</InputLabel>
                  <Select
                    labelId="user-role-label"
                    value={userForm.role}
                    label="Função"
                    onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value }))}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.name}>{role.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={viewOnly}>
                  <InputLabel id="user-division-label">Divisão</InputLabel>
                  <Select
                    labelId="user-division-label"
                    value={userForm.divisionId}
                    label="Divisão"
                    onChange={(event) => setUserForm((current) => ({ ...current, divisionId: event.target.value }))}
                  >
                    {divisions.map((division) => (
                      <MenuItem key={division.id} value={division.id}>{division.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField
              label="Cargo/Título"
              value={userForm.jobTitle}
              onChange={(event) => setUserForm((current) => ({ ...current, jobTitle: event.target.value }))}
              disabled={viewOnly}
              fullWidth
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Switch
                checked={Boolean(userForm.isActive)}
                onChange={(event) => setUserForm((current) => ({ ...current, isActive: event.target.checked }))}
                disabled={viewOnly}
                inputProps={{ 'aria-label': 'Estado ativo do utilizador' }}
              />
              <Typography>{userForm.isActive ? 'Ativo' : 'Inativo'}</Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Fechar</Button>
          {!viewOnly && (
            <Button variant="contained" onClick={handleSubmitUser} disabled={userSaving}>
              Guardar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={assignmentDialogOpen} onClose={() => setAssignmentDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Nova nomeação</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            {validationError && <Alert severity="error">{validationError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth disabled={fixedProjectContext}>
                  <InputLabel id="assignment-context-label">Contexto</InputLabel>
                  <Select
                    labelId="assignment-context-label"
                    value={assignmentForm.contextType}
                    label="Contexto"
                    onChange={(event) => setAssignmentForm((current) => ({ ...current, contextType: event.target.value }))}
                  >
                    <MenuItem value="DASHBOARD">Dashboard</MenuItem>
                    <MenuItem value="BUSINESS_INTAKE">Business Intake</MenuItem>
                    <MenuItem value="PROJECT">Projeto</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="assignment-user-label">Utilizador</InputLabel>
                  <Select
                    labelId="assignment-user-label"
                    value={assignmentForm.userId}
                    label="Utilizador"
                    onChange={(event) => setAssignmentForm((current) => ({ ...current, userId: event.target.value }))}
                  >
                    {users.filter((user) => user.isActive).map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.displayName || user.username} · {user.divisionName || 'Sem divisão'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="assignment-role-label">Função no contexto</InputLabel>
                  <Select
                    labelId="assignment-role-label"
                    value={assignmentForm.assignedRole}
                    label="Função no contexto"
                    onChange={(event) => setAssignmentForm((current) => ({ ...current, assignedRole: event.target.value }))}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.name}>{role.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            {assignmentForm.contextType === 'PROJECT' && (
              <FormControl fullWidth disabled={fixedProjectContext}>
                <InputLabel id="assignment-project-label">Projeto</InputLabel>
                <Select
                  labelId="assignment-project-label"
                  value={assignmentForm.contextId}
                  label="Projeto"
                  onChange={(event) => setAssignmentForm((current) => ({ ...current, contextId: event.target.value }))}
                >
                  {currentContextOptions.map((project) => (
                    <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField
              label="Observações"
              value={assignmentForm.notes}
              onChange={(event) => setAssignmentForm((current) => ({ ...current, notes: event.target.value }))}
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmitAssignment}>
            Submeter
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Rejeitar nomeação</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            {validationError && <Alert severity="error">{validationError}</Alert>}
            <TextField
              label="Motivo da rejeição"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              multiline
              rows={4}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleReject}>
            Rejeitar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback((current) => ({ ...current, open: false }))}
      >
        <Alert severity={feedback.severity} onClose={() => setFeedback((current) => ({ ...current, open: false }))}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TeamPage;
