import React from 'react';
import { Box, Typography } from '@mui/material';
import { getAssetUrl } from '../utils/assets';

const NAVY = '#182439';

const Footer = () => (
  <Box component="footer" sx={{ mt: 'auto' }}>
    {/* Main footer body */}
    <Box
      sx={{
        backgroundColor: NAVY,
        px: 4,
        py: 2.5,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <img
        src={getAssetUrl('marinha-logo.png')}
        alt="Marinha"
        style={{ height: 72, width: 'auto' }}
      />
    </Box>

    {/* Bottom info bar */}
    <Box
      sx={{
        backgroundColor: NAVY,
        px: 4,
        py: 1.2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem' }}>
        Aplicação de Gestão do Fluxo de trabalho
      </Typography>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem' }}>
        © {new Date().getFullYear()} Marinha. Todos os direitos reservados.
      </Typography>
    </Box>
  </Box>
);

export default Footer;
