import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchIntakes, createIntake } from '../features/intake/intakeSlice';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Button, Box, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const STATUS_COLORS = {
  pending: 'warning',
  processed: 'info',
};

const STATUS_LABELS = {
  pending: 'Pendente',
  processed: 'Processado',
};

const APPROVAL_STATUS_COLORS = {
  pending: 'default',
  approved: 'success',
  frozen: 'warning',
  no_capacity: 'error',
};

const APPROVAL_STATUS_LABELS = {
  pending: 'Em análise',
  approved: 'Aprovado',
  frozen: 'Congelado',
  no_capacity: 'Sem capacidade',
};

const emptyForm = {
  title: '',
  description: '',
  business_justification: '',
  start_date: '',
  completion_date: '',
};

const formatDate = (value) => {
  if (!value) {
    return '—';
  }

  const [year, month, day] = String(value).split('T')[0].split('-').map(Number);

  if (!year || !month || !day) {
    return '—';
  }

  return new Date(year, month - 1, day).toLocaleDateString('pt-PT');
};

const IntakeList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { intakes, isLoading, error } = useSelector((state) => state.intake);
  const { user } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    dispatch(fetchIntakes());
  }, [dispatch, user, navigate]);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setSubmitError('Título e descrição são obrigatórios.');
      return;
    }
    if (form.start_date && form.completion_date && form.start_date > form.completion_date) {
      setSubmitError('A data de início não pode ser maior que a data de conclusão.');
      return;
    }
    const result = await dispatch(createIntake(form));
    if (result.meta.requestStatus === 'fulfilled') {
      setOpen(false);
      setForm(emptyForm);
      setSubmitError(null);
    } else {
      setSubmitError(result.payload?.message || 'Erro ao submeter pedido.');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSubmitError(null);
    setForm(emptyForm);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">Business Intake</Typography>
          <Button variant="text" sx={{ px: 0, mt: 0.5 }} onClick={() => navigate('/intake/team')}>
            Equipa
          </Button>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Novo Pedido
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{typeof error === 'string' ? error : error.message || 'Erro'}</Alert>}

      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Título</strong></TableCell>
                <TableCell><strong>Solicitado por</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Estado de aprovação</strong></TableCell>
                <TableCell><strong>Período</strong></TableCell>
                <TableCell><strong>Projeto Criado</strong></TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {intakes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">Nenhum pedido encontrado.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                intakes.map((intake) => (
                  <TableRow key={intake.id} hover>
                    <TableCell>{intake.title}</TableCell>
                    <TableCell>{intake.requested_by_name}</TableCell>
                    <TableCell>
                      <Chip label={STATUS_LABELS[intake.status] || intake.status} color={STATUS_COLORS[intake.status] || 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={APPROVAL_STATUS_LABELS[intake.approval_status || 'pending'] || intake.approval_status}
                        color={APPROVAL_STATUS_COLORS[intake.approval_status || 'pending'] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{`${formatDate(intake.start_date)} - ${formatDate(intake.completion_date)}`}</TableCell>
                    <TableCell>
                      {intake.project_id ? (
                        <Button size="small" onClick={() => navigate(`/projects/${intake.project_id}`)}>
                          Ver Projeto
                        </Button>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => navigate(`/intake/${intake.id}`)}>
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Novo Pedido de Business Intake</DialogTitle>
        <DialogContent>
          {submitError && <Alert severity="error" sx={{ mb: 1 }}>{submitError}</Alert>}
          <TextField
            label="Título"
            fullWidth
            margin="normal"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <TextField
            label="Descrição"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <TextField
            label="Justificação de negócio"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={form.business_justification}
            onChange={(e) => setForm({ ...form, business_justification: e.target.value })}
          />
          <TextField
            label="Data de início"
            type="date"
            fullWidth
            margin="normal"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Data de conclusão"
            type="date"
            fullWidth
            margin="normal"
            value={form.completion_date}
            onChange={(e) => setForm({ ...form, completion_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>Submeter</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default IntakeList;
