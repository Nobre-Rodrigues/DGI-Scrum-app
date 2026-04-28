import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../features/auth/authSlice';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import InboxIcon from '@mui/icons-material/Inbox';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import { getAssetUrl } from '../utils/assets';

const NAVY = '#182439';

const NavBar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(path + '/');

  const navBtn = (active) => ({
    color: 'white',
    fontWeight: active ? 700 : 400,
    borderBottom: active ? '2px solid white' : '2px solid transparent',
    borderRadius: 0,
    px: 1.5,
    py: 0.5,
    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
  });

  return (
    <AppBar position="fixed" sx={{ backgroundColor: NAVY, boxShadow: 3 }}>
      <Toolbar>
        {/* Logo + brand */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mr: 3, flexShrink: 0 }}
          onClick={() => navigate('/')}
        >
          <img src={getAssetUrl('marinha-logo.png')} alt="Marinha" style={{ height: 44, width: 'auto' }} />
        </Box>

        {/* Nav buttons */}
        <Box sx={{ display: 'flex', gap: 0.5, flexGrow: 1 }}>
          <Button startIcon={<DashboardIcon />} onClick={() => navigate('/')} sx={navBtn(isActive('/'))}>
            Dashboard
          </Button>
          <Button startIcon={<InboxIcon />} onClick={() => navigate('/intake')} sx={navBtn(isActive('/intake'))}>
            Business Intake
          </Button>
          <Button startIcon={<FolderIcon />} onClick={() => navigate('/projects')} sx={navBtn(isActive('/projects'))}>
            Projetos
          </Button>
          <Button startIcon={<PeopleIcon />} onClick={() => navigate('/team')} sx={navBtn(isActive('/team') || isActive('/projects/team') || isActive('/intake/team'))}>
            Equipa
          </Button>
        </Box>

        {/* User info + logout */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {user && (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>
              {user.username} · {user.role}
            </Typography>
          )}
          <Button
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            size="small"
            sx={{
              color: 'white',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: 1,
              px: 1.5,
              ml: 1,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'white' },
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
