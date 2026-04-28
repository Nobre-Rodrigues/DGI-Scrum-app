import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';

const TeamPageBanner = ({ onDashboardTeam, onIntakeTeam, onProjectsTeam, onCreateUser, onCreateAssignment, canManageUsers, canNominateUser }) => (
  <Box>
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
      <Box>
        <Typography variant="h4" fontWeight={800}>Equipa</Typography>
        <Typography color="text.secondary">Gestão de utilizadores, funções, divisões e participações</Typography>
      </Box>
      <Stack direction="row" spacing={1.5}>
        {canNominateUser && (
          <Button variant="outlined" onClick={onCreateAssignment}>
            Nova nomeação
          </Button>
        )}
        {canManageUsers && (
          <Button variant="contained" onClick={onCreateUser}>
            Adicionar utilizador
          </Button>
        )}
      </Stack>
    </Stack>

    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mt={2}>
      <Button variant="text" onClick={onDashboardTeam} sx={{ px: 0, alignSelf: 'flex-start' }}>
        Dashboard &gt; Equipa
      </Button>
      <Button variant="text" onClick={onIntakeTeam} sx={{ px: 0, alignSelf: 'flex-start' }}>
        Business Intake &gt; Equipa
      </Button>
      <Button variant="text" onClick={onProjectsTeam} sx={{ px: 0, alignSelf: 'flex-start' }}>
        Projetos &gt; Equipa
      </Button>
    </Stack>
  </Box>
);

export default TeamPageBanner;
