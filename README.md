# Scrum Project Management Application

A fully functional, responsive web application for Scrum project management supporting up to 30 simultaneous users.

## Architecture

- **Frontend**: React with Redux for state management, Material-UI for components, FullCalendar for calendar, Chart.js for charts, react-beautiful-dnd for drag-and-drop.
- **Backend**: Node.js with Express, JWT authentication, MSSQL database.
- **Database**: MSSQL with tables for Users, Projects, Sprints, BacklogItems, Tasks, Events.

## Features

- User management with role-based permissions (Product Owner, Scrum Master, Development Team Member, Stakeholder)
- Product backlog management
- Sprint management
- Kanban board with drag-and-drop
- Integrated calendar with automatic Scrum event generation
- Dashboard with burndown, velocity, and workload charts

## Installation

### Prerequisites

- Node.js
- MSSQL Server (localhost,1433)
- npm

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Update `.env` with your database credentials.

4. Start the server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

### Database Setup

The database schema is created via SQL scripts in the `database` folder. Run the SQL files in your MSSQL server to set up the tables.

## API Documentation

API documentation is available at `http://localhost:5000/api-docs` when the backend is running.

## Usage

1. Register users with different roles.
2. Create projects (Product Owner only).
3. Add backlog items and tasks.
4. Create sprints and manage them.
5. Use the Kanban board to track task progress.
6. View the calendar for Scrum events.
7. Check the dashboard for metrics.

## Example Data

Some seed data is inserted in the database for testing.

- Users: po1, sm1, dev1, dev2, stake1 (password: password)
- Project: Sample Project
- Backlog items and tasks as examples.

## Security

- JWT authentication
- Role-based authorization
- Input validation
- Rate limiting

## Responsive Design

The application is fully responsive and works on mobile, tablet, and desktop devices.