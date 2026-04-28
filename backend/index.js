const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();
const { initializeSchema } = require('./config/schema');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const backlogRoutes = require('./routes/backlog');
const sprintRoutes = require('./routes/sprints');
const taskRoutes = require('./routes/tasks');
const eventRoutes = require('./routes/events');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');
const intakeRoutes = require('./routes/intake');
const projectDashboardRoutes = require('./routes/projectDashboard');
const workItemRoutes = require('./routes/workItems');
const divisionRoutes = require('./routes/divisions');
const roleRoutes = require('./routes/roles');
const teamAssignmentRoutes = require('./routes/teamAssignments');
const meRoutes = require('./routes/me');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  skip: (req) => {
    const ip = req.ip || req.socket?.remoteAddress || '';
    return ip === '127.0.0.1'
      || ip === '::1'
      || ip === '::ffff:127.0.0.1'
      || req.hostname === 'localhost';
  },
});
app.use(limiter);

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Scrum Project Management API',
      version: '1.0.0',
      description: 'API for managing Scrum projects',
    },
    servers: [
      {
        url: 'http://localhost:5000',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', projectDashboardRoutes);
app.use('/api/backlog', backlogRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/divisions', divisionRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/team-assignments', teamAssignmentRoutes);
app.use('/api/me', meRoutes);
app.use('/api/intake', intakeRoutes);
app.use('/api/work-items', workItemRoutes);
app.use('/api/ai', aiRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to the API');
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const startServer = async () => {
  await initializeSchema();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to initialize application schema', error);
  process.exit(1);
});
