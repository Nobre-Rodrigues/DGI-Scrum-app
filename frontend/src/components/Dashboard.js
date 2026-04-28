import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../features/project/projectSlice';
import { fetchDashboardData } from '../features/dashboard/dashboardSlice';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Grid, Card, CardContent, List, ListItem, ListItemText, Button, Stack } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projects, currentProject } = useSelector((state) => state.project);
  const { data: dashboardData } = useSelector((state) => state.dashboard);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      dispatch(fetchProjects());
      if (currentProject) {
        dispatch(fetchDashboardData(currentProject.id));
      }
    } else {
      navigate('/login');
    }
  }, [dispatch, user, currentProject, navigate]);

  if (!user) return null;

  const velocityData = {
    labels: dashboardData?.velocity?.map(v => v.name) || [],
    datasets: [{
      label: 'Velocity',
      data: dashboardData?.velocity?.map(v => v.velocity) || [],
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
    }],
  };

  const workloadData = {
    labels: dashboardData?.workload?.map(w => w.username) || [],
    datasets: [{
      label: 'Tasks',
      data: dashboardData?.workload?.map(w => w.task_count) || [],
      backgroundColor: 'rgba(153, 102, 255, 0.6)',
    }],
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} mb={3}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/team')}>
          Equipa
        </Button>
      </Stack>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Projetos</Typography>
              <List>
                {projects.map(project => (
                  <ListItem key={project.id} button onClick={() => navigate(`/projects/${project.id}`)}>
                    <ListItemText primary={project.name} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        {dashboardData && (
          <>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Velocity Chart</Typography>
                  <Bar data={velocityData} />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Workload</Typography>
                  <Bar data={workloadData} />
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </Container>
  );
};

export default Dashboard;
