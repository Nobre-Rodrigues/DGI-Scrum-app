import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../features/auth/authSlice';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { TextField, Button, Container, Typography, Alert, Link, Box } from '@mui/material';
import { getAssetUrl } from '../utils/assets';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login({ email, password }));
    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          mt: 26,
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
          Autenticação
        </Typography>
        <Box
          component="img"
          src={getAssetUrl('Size=sm, Dark mode=False, Text=True, Logo_mode=Default.png')}
          alt="Logótipo da Marinha"
          sx={{ height: 40, width: 'auto', objectFit: 'contain', display: 'block', flexShrink: 0 }}
        />
      </Box>
      {error && <Alert severity="error">{error.message}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" variant="contained" color="primary" fullWidth disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
      <div style={{ marginTop: 16 }}>
        <span>Não tem conta? </span>
        <Link component={RouterLink} to="/register">Registar</Link>
      </div>
    </Container>
  );
};

export default Login;
