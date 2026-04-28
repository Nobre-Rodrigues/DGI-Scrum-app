import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, updateUser, deleteUser } from '../features/user/userSlice';
import { Container, Typography, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, IconButton, Snackbar, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const roles = ['Product Owner', 'Scrum Master', 'Development Team Member', 'Stakeholder', 'Director'];

const AdminUsers = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.user);
  const { user } = useSelector((state) => state.auth);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      dispatch(fetchUsers());
    }
  }, [dispatch, user]);

  const handleRoleChange = (id, role) => {
    dispatch(updateUser({ id, role })).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        setMessage('User role updated');
      }
    });
  };

  const handleDelete = (id) => {
    dispatch(deleteUser(id)).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        setMessage('User deleted');
      }
    });
  };

  if (!user || user.role !== 'Product Owner') {
    return <Typography>Access denied. Product Owner only area.</Typography>;
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        User Administration
      </Typography>
      {loading && <Typography>Loading...</Typography>}
      {error && <Alert severity="error">{error.message || 'Error loading users'}</Alert>}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Username</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.username}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>
                <Select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                  {roles.map((role) => (
                    <MenuItem key={role} value={role}>{role}</MenuItem>
                  ))}
                </Select>
              </TableCell>
              <TableCell>
                <IconButton onClick={() => handleDelete(u.id)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Snackbar open={Boolean(message)} autoHideDuration={3000} onClose={() => setMessage('')}>
        <Alert onClose={() => setMessage('')} severity="success" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminUsers;
