import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Container,
  Typography,
  Alert,
  MenuItem
} from '@mui/material';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: '',
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(register(formData));

    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/login');
    }
  };

  // Corrige o erro: garante que mostramos sempre uma string válida
  const getErrorMessage = () => {
    if (!error) return null;
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.error) return error.error;
    if (Array.isArray(error.errors)) {
      return error.errors.map((e) => e.msg || e.message).join(' | ');
    }
    return 'Registration failed';
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" component="h1" gutterBottom>
        Register
      </Typography>

      {error && <Alert severity="error">{getErrorMessage()}</Alert>}

      <form onSubmit={handleSubmit}>
        <TextField
          label="Username"
          name="username"
          fullWidth
          margin="normal"
          value={formData.username}
          onChange={handleChange}
          required
        />

        <TextField
          label="Email"
          name="email"
          type="email"
          fullWidth
          margin="normal"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <TextField
          label="Password"
          name="password"
          type="password"
          fullWidth
          margin="normal"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <TextField
          label="Role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          select
          fullWidth
          margin="normal"
          required
        >
          <MenuItem value="Product Owner">Product Owner</MenuItem>
          <MenuItem value="Scrum Master">Scrum Master</MenuItem>
          <MenuItem value="Development Team Member">Development Team Member</MenuItem>
          <MenuItem value="Stakeholder">Stakeholder</MenuItem>
        </TextField>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={isLoading}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </Button>
      </form>
    </Container>
  );
};

export default Register;
