import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchIntakeById, updateIntakeApprovalStatus } from '../features/intake/intakeSlice';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container, Typography, Button, Box, Chip, Divider,
  TextField, Paper, CircularProgress, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, Stack,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const STATUS_COLORS = { pending: 'warning', processed: 'info' };
const STATUS_LABELS = { pending: 'Pendente', processed: 'Processado' };
const APPROVAL_STATUS_COLORS = { pending: 'default', approved: 'success', frozen: 'warning', no_capacity: 'error' };
const APPROVAL_STATUS_LABELS = { pending: 'Em análise', approved: 'Aprovado', frozen: 'Congelado', no_capacity: 'Sem capacidade' };
const APPROVAL_OPTIONS = [
  { value: 'approved', label: 'Aprovado' },
  { value: 'frozen', label: 'Congelado' },
  { value: 'no_capacity', label: 'Sem capacidade' },
];

const formatDate = (value, includeTime = false) => {
  if (!value) {
    return '—';
  }

  const date = String(value).includes('T')
    ? new Date(value)
    : (() => {
        const [year, month, day] = String(value).split('T')[0].split('-').map(Number);
        return new Date(year, month - 1, day);
      })();

  return includeTime ? date.toLocaleString('pt-PT') : date.toLocaleDateString('pt-PT');
};

const IntakeDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentIntake: intake, isLoading, error } = useSelector((state) => state.intake);
  const { user } = useSelector((state) => state.auth);
  const isDirector = user?.role === 'Director';

  const [decisionOpen, setDecisionOpen] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState('approved');
  const [notes, setNotes] = useState('');
  const [actionError, setActionError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    dispatch(fetchIntakeById(id));
  }, [dispatch, id, user, navigate]);

  const handleDecision = async () => {
    setActionLoading(true);
    setActionError(null);
    const result = await dispatch(updateIntakeApprovalStatus({ id, approval_status: approvalStatus, director_notes: notes }));
    setActionLoading(false);
    if (result.meta.requestStatus === 'fulfilled') {
      setDecisionOpen(false);
      setNotes('');
      setApprovalStatus('approved');
    } else {
      setActionError(result.payload?.message || 'Erro ao atualizar estado de aprovação.');
    }
  };

  if (isLoading || !intake) {
    return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{typeof error === 'string' ? error : 'Erro ao carregar'}</Alert>}
      {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}

      <Paper sx={{ p: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h5" fontWeight="bold">{intake.title}</Typography>
          <Stack direction="row" spacing={1}>
            <Chip
              label={STATUS_LABELS[intake.status] || intake.status}
              color={STATUS_COLORS[intake.status] || 'default'}
            />
            <Chip
              label={APPROVAL_STATUS_LABELS[intake.approval_status || 'pending'] || intake.approval_status}
              color={APPROVAL_STATUS_COLORS[intake.approval_status || 'pending'] || 'default'}
            />
          </Stack>
        </Box>

        <Stack spacing={2}>
          <Box>
            <Typography variant="overline" color="text.secondary">Solicitado por</Typography>
            <Typography>{intake.requested_by_name}</Typography>
          </Box>

          <Box>
            <Typography variant="overline" color="text.secondary">Data de Submissão</Typography>
            <Typography>{formatDate(intake.created_at, true)}</Typography>
          </Box>

          <Box>
            <Typography variant="overline" color="text.secondary">Data de Início</Typography>
            <Typography>{formatDate(intake.start_date)}</Typography>
          </Box>

          <Box>
            <Typography variant="overline" color="text.secondary">Data de Conclusão</Typography>
            <Typography>{formatDate(intake.completion_date)}</Typography>
          </Box>

          <Box>
            <Typography variant="overline" color="text.secondary">Estado de Aprovação</Typography>
            <Typography>{APPROVAL_STATUS_LABELS[intake.approval_status || 'pending'] || intake.approval_status}</Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="overline" color="text.secondary">Descrição</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{intake.description}</Typography>
          </Box>

          {intake.business_justification && (
            <Box>
              <Typography variant="overline" color="text.secondary">Justificação de Negócio</Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{intake.business_justification}</Typography>
            </Box>
          )}

          {intake.director_notes && (
            <>
              <Divider />
              <Box>
                <Typography variant="overline" color="text.secondary">Notas do Diretor</Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{intake.director_notes}</Typography>
              </Box>
            </>
          )}

          {intake.project_id && (
            <>
              <Divider />
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="overline" color="text.secondary">Projeto Criado</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  endIcon={<OpenInNewIcon />}
                  onClick={() => navigate(`/projects/${intake.project_id}`)}
                >
                  Ver Projeto
                </Button>
              </Box>
            </>
          )}
        </Stack>

        {isDirector && (intake.approval_status || 'pending') === 'pending' && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                startIcon={<CheckCircleIcon />}
                onClick={() => {
                  setNotes('');
                  setApprovalStatus('approved');
                  setDecisionOpen(true);
                }}
              >
                Definir Estado de Aprovação
              </Button>
            </Box>
          </>
        )}
      </Paper>

      <Dialog open={decisionOpen} onClose={() => setDecisionOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Estado de Aprovação</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            O diretor pode escolher se este pedido fica aprovado, congelado ou sem capacidade.
          </Typography>
          <TextField
            select
            label="Estado de aprovação"
            fullWidth
            margin="normal"
            value={approvalStatus}
            onChange={(e) => setApprovalStatus(e.target.value)}
            SelectProps={{ native: true }}
          >
            {APPROVAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </TextField>
          <TextField
            label="Notas (opcional)"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecisionOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleDecision} disabled={actionLoading}>
            {actionLoading ? 'A guardar...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default IntakeDetail;
