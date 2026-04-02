import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import Backlog from './components/Backlog';
import Kanban from './components/Kanban';
import Calendar from './components/Calendar';
import AdminUsers from './components/AdminUsers';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/projects/:id/backlog" element={<Backlog />} />
            <Route path="/projects/:id/kanban" element={<Kanban />} />
            <Route path="/projects/:id/calendar" element={<Calendar />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
