const { isRoleValid } = require('./authorizationService');

const validateUserPayload = ({ displayName, email, role, divisionId }) => {
  if (!String(displayName || '').trim()) {
    return 'O nome é obrigatório.';
  }

  if (!String(email || '').trim()) {
    return 'O email ou identificador é obrigatório.';
  }

  if (!String(role || '').trim() || !isRoleValid(role)) {
    return 'A função é obrigatória e tem de ser válida.';
  }

  if (!divisionId) {
    return 'A divisão é obrigatória.';
  }

  return null;
};

module.exports = {
  validateUserPayload,
};
