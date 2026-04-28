import React from 'react';
import NavBar from './NavBar';
import Footer from './Footer';
import { Box } from '@mui/material';

const Layout = ({ children }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <NavBar />
    <Box sx={{ mt: '64px', flexGrow: 1 }}>
      {children}
    </Box>
    <Footer />
  </Box>
);

export default Layout;
