const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildPermissions,
  canApproveParticipation,
  getAssignmentDecision,
} = require('../services/authorizationService');
const { validateUserPayload } = require('../services/userValidationService');

test('validateUserPayload requires display name', () => {
  const message = validateUserPayload({
    displayName: '',
    email: 'utilizador@org.pt',
    role: 'Desenvolvedor',
    divisionId: 1,
  });

  assert.equal(message, 'O nome é obrigatório.');
});

test('validateUserPayload requires role', () => {
  const message = validateUserPayload({
    displayName: 'Utilizador',
    email: 'utilizador@org.pt',
    role: '',
    divisionId: 1,
  });

  assert.equal(message, 'A função é obrigatória e tem de ser válida.');
});

test('validateUserPayload requires division', () => {
  const message = validateUserPayload({
    displayName: 'Utilizador',
    email: 'utilizador@org.pt',
    role: 'Desenvolvedor',
    divisionId: null,
  });

  assert.equal(message, 'A divisão é obrigatória.');
});

test('same-division nomination by division chief is auto-approved', () => {
  const decision = getAssignmentDecision({
    actor: { role: 'Chefe da Divisão de Análise da Informação' },
    actorDivisionCode: 'DAI',
    targetDivisionCode: 'DAI',
  });

  assert.deepEqual(decision, {
    approvalRequired: false,
    approvalStatus: 'APPROVED',
  });
});

test('cross-division nomination by division chief becomes pending', () => {
  const decision = getAssignmentDecision({
    actor: { role: 'Chefe da Divisão de Análise da Informação' },
    actorDivisionCode: 'DAI',
    targetDivisionCode: 'DSI',
  });

  assert.deepEqual(decision, {
    approvalRequired: true,
    approvalStatus: 'PENDING',
  });
});

test('division chief can approve assignments for own division', () => {
  const allowed = canApproveParticipation({
    actor: { role: 'Chefe da Divisão de Sistemas de Informação' },
    assignmentTargetDivisionCode: 'DSI',
  });

  assert.equal(allowed, true);
});

test('director can approve any assignment', () => {
  const allowed = canApproveParticipation({
    actor: { role: 'Diretor' },
    assignmentTargetDivisionCode: 'DAI',
  });

  assert.equal(allowed, true);
});

test('subdirector can approve any assignment', () => {
  const allowed = canApproveParticipation({
    actor: { role: 'Subdiretor' },
    assignmentTargetDivisionCode: 'DSI',
  });

  assert.equal(allowed, true);
});

test('head of DGI can approve any assignment', () => {
  const allowed = canApproveParticipation({
    actor: { role: 'Chefe da Divisão de Gestão da Informação' },
    assignmentTargetDivisionCode: 'DSI',
  });

  assert.equal(allowed, true);
});

test('developer cannot approve assignments', () => {
  const allowed = canApproveParticipation({
    actor: { role: 'Desenvolvedor' },
    assignmentTargetDivisionCode: 'DAI',
  });

  assert.equal(allowed, false);
});

test('buildPermissions exposes management capabilities for full admin', () => {
  const permissions = buildPermissions({ id: 1, role: 'Diretor' });

  assert.equal(permissions.canManageUsers, true);
  assert.equal(permissions.canApproveParticipation, true);
  assert.equal(permissions.canManageAllDivisions, true);
});
