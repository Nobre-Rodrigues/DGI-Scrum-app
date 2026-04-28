const DIVISIONS = [
  { code: 'DIRECAO', name: 'Direção', isActive: true },
  { code: 'DAI', name: 'Divisão de Análise da Informação', isActive: true },
  { code: 'DGI', name: 'Divisão de Gestão da Informação', isActive: true },
  { code: 'DSI', name: 'Divisão de Sistemas de Informação', isActive: true },
];

const ROLES = [
  { code: 'DIRECTOR', name: 'Diretor', isActive: true },
  { code: 'SUBDIRECTOR', name: 'Subdiretor', isActive: true },
  { code: 'HEAD_DGI', name: 'Chefe da Divisão de Gestão da Informação', isActive: true },
  { code: 'HEAD_DAI', name: 'Chefe da Divisão de Análise da Informação', isActive: true },
  { code: 'HEAD_DSI', name: 'Chefe da Divisão de Sistemas de Informação', isActive: true },
  { code: 'DEVELOPER', name: 'Desenvolvedor', isActive: true },
  { code: 'PRODUCT_OWNER', name: 'Product Owner', isActive: true },
  { code: 'SCRUM_MASTER', name: 'Scrum Master', isActive: true },
  { code: 'DEV_TEAM_MEMBER', name: 'Development Team Member', isActive: true },
  { code: 'STAKEHOLDER', name: 'Stakeholder', isActive: true },
  { code: 'LEGACY_DIRECTOR', name: 'Director', isActive: true },
];

const ROLE_NAMES = ROLES.map((role) => role.name);
const DIVISION_CODES = DIVISIONS.map((division) => division.code);
const ASSIGNMENT_CONTEXT_TYPES = ['DASHBOARD', 'BUSINESS_INTAKE', 'PROJECT'];
const ASSIGNMENT_APPROVAL_STATUSES = ['APPROVED', 'PENDING', 'REJECTED', 'CANCELLED'];

module.exports = {
  DIVISIONS,
  ROLES,
  ROLE_NAMES,
  DIVISION_CODES,
  ASSIGNMENT_CONTEXT_TYPES,
  ASSIGNMENT_APPROVAL_STATUSES,
};
