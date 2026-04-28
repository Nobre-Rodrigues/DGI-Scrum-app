import { render, screen } from '@testing-library/react';
import TeamPageBanner from './components/team/TeamPageBanner';

test('renders Equipa page title, actions, and user list', () => {
  render(
    <TeamPageBanner
      onDashboardTeam={() => {}}
      onIntakeTeam={() => {}}
      onProjectsTeam={() => {}}
      onCreateUser={() => {}}
      onCreateAssignment={() => {}}
      canManageUsers
      canNominateUser
    />
  );

  expect(screen.getByText('Equipa')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Adicionar utilizador/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Nova nomeação/i })).toBeInTheDocument();
  expect(screen.getByText('Dashboard > Equipa')).toBeInTheDocument();
  expect(screen.getByText('Business Intake > Equipa')).toBeInTheDocument();
});
