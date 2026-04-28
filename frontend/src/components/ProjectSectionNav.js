import React from 'react';
import { NavLink } from 'react-router-dom';
import { Box, Stack, Typography } from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ChecklistRtlOutlinedIcon from '@mui/icons-material/ChecklistRtlOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';

const navItems = [
  { key: 'summary', label: 'Resumo', icon: DashboardOutlinedIcon, getTo: (projectId) => `/projects/${projectId}` },
  { key: 'backlog', label: 'Backlog', icon: ChecklistRtlOutlinedIcon, getTo: (projectId) => `/projects/${projectId}/backlog` },
  { key: 'kanban', label: 'Kanban Board', icon: ViewKanbanOutlinedIcon, getTo: (projectId) => `/projects/${projectId}/kanban` },
  { key: 'calendar', label: 'Calendar', icon: CalendarMonthOutlinedIcon, getTo: (projectId) => `/projects/${projectId}/calendar` },
  { key: 'team', label: 'Equipa', icon: GroupOutlinedIcon, getTo: (projectId) => `/projects/${projectId}/team` },
];

const ProjectSectionNav = ({ projectId, current = 'summary' }) => (
  <Box
    component="nav"
    aria-label="Navegação das áreas do projeto"
    sx={{
      borderBottom: '1px solid #D0D5DD',
      backgroundColor: '#FFFFFF',
      overflowX: 'auto',
    }}
  >
    <Stack
      direction="row"
      spacing={0}
      sx={{
        px: { xs: 0.5, md: 0 },
        minWidth: 'max-content',
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = current === item.key;

        return (
          <Box
            key={item.key}
            component={NavLink}
            to={item.getTo(projectId)}
            sx={{
              textDecoration: 'none',
              color: isActive ? '#0B4F71' : '#344054',
              px: { xs: 1.5, md: 2 },
              py: 1.5,
              minWidth: 152,
              borderBottom: isActive ? '3px solid #0B7FAB' : '3px solid transparent',
              transition: 'color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
              '&:hover': {
                backgroundColor: '#F8FBFD',
                color: '#0B4F71',
              },
              '&:focus-visible': {
                outline: '3px solid #98A2B3',
                outlineOffset: -3,
                borderRadius: 1,
              },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Icon fontSize="small" sx={{ color: isActive ? '#0B7FAB' : '#667085' }} />
              <Typography
                fontWeight={isActive ? 800 : 600}
                whiteSpace="nowrap"
                sx={{ letterSpacing: '-0.01em' }}
              >
                {item.label}
              </Typography>
            </Stack>
          </Box>
        );
      })}
    </Stack>
  </Box>
);

export default ProjectSectionNav;
