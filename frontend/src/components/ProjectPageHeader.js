import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { fetchProjects, setCurrentProject } from '../features/project/projectSlice';
import { fetchProjectDashboard } from '../features/projectDashboard/projectDashboardSlice';
import ProjectSectionNav from './ProjectSectionNav';

const statusTone = {
  'Não iniciado': { color: '#344054', backgroundColor: '#F2F4F7' },
  'Em curso': { color: '#175CD3', backgroundColor: '#EFF8FF' },
  'Em risco': { color: '#B54708', backgroundColor: '#FFF7ED' },
  Bloqueado: { color: '#B42318', backgroundColor: '#FEF3F2' },
  Concluído: { color: '#027A48', backgroundColor: '#ECFDF3' },
};

const formatDate = (value) => {
  if (!value) {
    return 'Sem data';
  }

  const date = new Date(String(value).split('T')[0]);

  if (Number.isNaN(date.getTime())) {
    return 'Sem data';
  }

  return new Intl.DateTimeFormat('pt-PT').format(date);
};

const getInitials = (value) => {
  const parts = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'PR';
  }

  return parts.map((part) => part[0]?.toUpperCase() || '').join('');
};

const statCardSx = {
  minWidth: 132,
  px: 1.5,
  py: 1.25,
  borderRadius: 3,
  backgroundColor: '#FFFFFF',
  border: '1px solid #D5E6EF',
};

const ProjectPageHeader = ({ projectId, current, eyebrow = 'Projeto', titleOverride, subtitle, actions = null }) => {
  const dispatch = useDispatch();
  const { projects, currentProject } = useSelector((state) => state.project);
  const { summary } = useSelector((state) => state.projectDashboard);

  useEffect(() => {
    if (!projects.length) {
      dispatch(fetchProjects());
    }
  }, [dispatch, projects.length]);

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectDashboard(projectId));
    }
  }, [dispatch, projectId]);

  const project = useMemo(
    () => projects.find((item) => Number(item.id) === Number(projectId)) || currentProject,
    [projects, currentProject, projectId]
  );

  useEffect(() => {
    if (project && Number(project.id) === Number(projectId)) {
      dispatch(setCurrentProject(project));
    }
  }, [dispatch, project, projectId]);

  const currentStatus = project?.status || 'Não iniciado';
  const statusStyle = statusTone[currentStatus] || statusTone['Não iniciado'];
  const headerTitle = titleOverride || project?.name || `Projeto ${projectId}`;
  const headerSummary = summary?.project?.id === Number(projectId) ? summary : null;
  const statItems = [
    {
      label: 'Progresso',
      value: `${Math.round(Number(headerSummary?.project?.progressPercentage || project?.progress_percentage || 0))}%`,
    },
    {
      label: 'Atualizações 7d',
      value: String(headerSummary?.recentUpdates?.count ?? 0),
    },
    {
      label: 'Planeado 7d',
      value: String(headerSummary?.planned?.count ?? 0),
    },
  ];

  return (
    <Stack spacing={0}>
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          py: { xs: 2.5, md: 3 },
          border: '1px solid #CFE5F1',
          borderBottom: 'none',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          background: 'linear-gradient(180deg, #EAF8FF 0%, #F7FCFF 100%)',
        }}
      >
        <Stack spacing={2.25}>
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{ color: '#5C6B7A', fontSize: 13 }}
          >
            <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 600 }}>
              Projetos
            </Typography>
            <NavigateNextIcon sx={{ fontSize: 16 }} />
            <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 600 }}>
              {project?.name || `Projeto ${projectId}`}
            </Typography>
            <NavigateNextIcon sx={{ fontSize: 16 }} />
            <Typography component="span" sx={{ fontSize: 'inherit', color: '#0B4F71', fontWeight: 700 }}>
              {headerTitle}
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            justifyContent="space-between"
            spacing={2}
            alignItems={{ xs: 'flex-start', lg: 'flex-start' }}
          >
            <Stack spacing={1.25}>
              <Typography
                variant="overline"
                sx={{ color: '#0B4F71', fontWeight: 800, letterSpacing: '0.08em' }}
              >
                {eyebrow}
              </Typography>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #EAF8FF 100%)',
                    border: '1px solid #CFE5F1',
                    color: '#0B7FAB',
                    flexShrink: 0,
                    fontWeight: 800,
                    boxShadow: '0 2px 8px rgba(11, 79, 113, 0.08)',
                  }}
                >
                  <FolderOpenOutlinedIcon sx={{ fontSize: 18 }} />
                  <Typography component="span" sx={{ fontSize: 14, fontWeight: 800, lineHeight: 1 }}>
                    {getInitials(project?.name)}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="h4"
                    component="h1"
                    sx={{ fontWeight: 800, letterSpacing: '-0.03em', color: '#182439' }}
                  >
                    {titleOverride || project?.name || `Projeto ${projectId}`}
                  </Typography>
                  <Typography color="text.secondary" sx={{ maxWidth: 920 }}>
                    {subtitle || project?.description || 'Área central de gestão do projeto, com backlog, board e calendário.'}
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="flex-start">
              {actions ? <Box>{actions}</Box> : null}
              <Tooltip title="Mais ações do projeto">
                <IconButton
                  aria-label="Mais ações do projeto"
                  sx={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D5E6EF',
                    '&:hover': { backgroundColor: '#F8FBFD' },
                  }}
                >
                  <MoreHorizIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} flexWrap="wrap" useFlexGap>
            <Chip
              icon={<FlagOutlinedIcon />}
              label={currentStatus}
              sx={{ fontWeight: 700, ...statusStyle }}
            />
            <Chip
              icon={<CalendarMonthOutlinedIcon />}
              label={`Início: ${formatDate(project?.start_date)}`}
              sx={{ fontWeight: 600, backgroundColor: '#FFFFFF', border: '1px solid #D5E6EF' }}
            />
            <Chip
              icon={<CalendarMonthOutlinedIcon />}
              label={`Fim: ${formatDate(project?.end_date)}`}
              sx={{ fontWeight: 600, backgroundColor: '#FFFFFF', border: '1px solid #D5E6EF' }}
            />
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} flexWrap="wrap" useFlexGap>
            {statItems.map((item) => (
              <Box key={item.label} sx={statCardSx}>
                <Typography variant="caption" sx={{ color: '#5C6B7A', fontWeight: 700, display: 'block' }}>
                  {item.label}
                </Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#182439', lineHeight: 1.1 }}>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Box>

      <Box
        sx={{
          border: '1px solid #CFE5F1',
          borderTop: 'none',
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          backgroundColor: '#FFFFFF',
          px: { xs: 1.5, md: 2.5 },
        }}
      >
        <ProjectSectionNav projectId={projectId} current={current} />
      </Box>
    </Stack>
  );
};

export default ProjectPageHeader;
