import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEvents } from '../features/event/eventSlice';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Container, Stack } from '@mui/material';
import ProjectPageHeader from './ProjectPageHeader';

const Calendar = () => {
  const { id: projectId } = useParams();
  const dispatch = useDispatch();
  const { events } = useSelector((state) => state.event);

  useEffect(() => {
    dispatch(fetchEvents(projectId));
  }, [dispatch, projectId]);

  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    backgroundColor: event.type === 'Sprint Planning' ? 'blue' : event.type === 'Daily Scrum' ? 'green' : 'red',
  }));

  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        <ProjectPageHeader
          projectId={projectId}
          current="calendar"
          eyebrow="Agenda"
          titleOverride="Project Calendar"
          subtitle="Visualize sprints, eventos e marcos do projeto com navegação direta para as restantes áreas."
        />
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={calendarEvents}
          height="auto"
        />
      </Stack>
    </Container>
  );
};

export default Calendar;
