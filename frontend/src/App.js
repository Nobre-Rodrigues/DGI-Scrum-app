import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { runtimeConfig } from './config/runtime';
import Login from './components/Login';
import Register from './components/Register';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import Backlog from './components/Backlog';
import Kanban from './components/Kanban';
import Calendar from './components/Calendar';
import AdminUsers from './components/AdminUsers';
import IntakeList from './components/IntakeList';
import IntakeDetail from './components/IntakeDetail';
import TeamPage from './components/TeamPage';
import './App.css';

function App() {
  const Router = runtimeConfig.routerMode === 'hash' ? HashRouter : BrowserRouter;
  const routerProps = runtimeConfig.routerMode === 'browser'
    ? { basename: runtimeConfig.routerBasename }
    : undefined;

  return (
    <Provider store={store}>
      <Router {...routerProps}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/projects" element={<Layout><ProjectList /></Layout>} />
          <Route path="/projects/:id" element={<Layout><ProjectDetail /></Layout>} />
          <Route path="/projects/:id/backlog" element={<Layout><Backlog /></Layout>} />
          <Route path="/projects/:id/kanban" element={<Layout><Kanban /></Layout>} />
          <Route path="/projects/:id/calendar" element={<Layout><Calendar /></Layout>} />
          <Route path="/projects/:id/team" element={<Layout><TeamPage defaultContextType="PROJECT" fixedProjectContext /></Layout>} />
          <Route path="/projects/team" element={<Layout><TeamPage defaultContextType="PROJECT" /></Layout>} />
          <Route path="/team" element={<Layout><TeamPage defaultContextType="DASHBOARD" /></Layout>} />
          <Route path="/intake/team" element={<Layout><TeamPage defaultContextType="BUSINESS_INTAKE" /></Layout>} />
          <Route path="/admin/users" element={<Layout><AdminUsers /></Layout>} />
          <Route path="/intake" element={<Layout><IntakeList /></Layout>} />
          <Route path="/intake/:id" element={<Layout><IntakeDetail /></Layout>} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
