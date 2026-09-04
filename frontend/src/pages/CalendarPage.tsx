import { useMemo, useState } from "react";
import FullCalendar, { type EventClickInfo, type EventInput } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import srLocale from "@fullcalendar/react/locales/sr";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import themePlugin from "@fullcalendar/react/themes/monarch";
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/monarch/theme.css";
import "@fullcalendar/react/themes/monarch/palettes/purple.css";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { taskPriorityLabels, taskStatusColors, taskStatusLabels } from "../task-options";
import type { Task, TaskStatus } from "../types";

const statusEventColors: Record<TaskStatus, string> = {
  TODO: "#64748b",
  IN_PROGRESS: "#2563eb",
  OVERDUE: "#dc2626",
  DONE: "#16a34a",
};

const srLatinLocale = {
  ...srLocale,
  code: "sr-Latn",
  prevText: "Prethodna",
  nextText: "Sledeća",
  todayText: "Danas",
  yearText: "Godina",
  monthText: "Mesec",
  weekTextLong: "Nedelja",
  weekTextShort: "Sed",
  dayText: "Dan",
  listText: "Planer",
  allDayText: "Ceo dan",
  moreLinkText: (count: number) => `+ još ${count}`,
  noEventsText: "Nema događaja za prikaz",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("sr-Latn-RS", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function CalendarPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const tasksQuery = useQuery({ queryKey: ["tasks", "calendar"], queryFn: () => api.tasks.list({}) });
  const employeesQuery = useQuery({ queryKey: ["employees"], queryFn: () => api.employees.list() });
  const resourcesQuery = useQuery({ queryKey: ["resources"], queryFn: () => api.resources.list({}) });

  const events = useMemo<EventInput[]>(() => {
    return (tasksQuery.data ?? [])
      .filter((task) => !employeeId || task.employeeId === employeeId)
      .filter((task) => !status || task.status === status)
      .filter(
        (task) =>
          !resourceId ||
          task.reservations.some((reservation) => reservation.resourceId === resourceId),
      )
      .map((task) => ({
        id: task.id,
        title: task.title,
        start: task.startsAt,
        end: task.dueAt,
        backgroundColor: statusEventColors[task.status],
        borderColor: statusEventColors[task.status],
        extendedProps: { task },
      }));
  }, [employeeId, resourceId, status, tasksQuery.data]);

  const handleEventClick = (info: EventClickInfo) => {
    setSelectedTask(info.event.extendedProps.task as Task);
  };

  if (tasksQuery.isLoading || employeesQuery.isLoading || resourcesQuery.isLoading) {
    return <Box className="page-loading"><CircularProgress /></Box>;
  }

  if (tasksQuery.isError || employeesQuery.isError || resourcesQuery.isError) {
    return <Container maxWidth="xl"><Alert severity="error">Kalendar trenutno nije dostupan.</Alert></Container>;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Kalendar obaveza</Typography>
        <Typography color="text.secondary">
          Mesečni, nedeljni i dnevni pregled zadataka, zaposlenih i rezervisanih resursa.
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: "1px solid", borderColor: "divider" }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2.5 }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Zaposleni</InputLabel>
            <Select label="Zaposleni" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
              <MenuItem value="">Svi zaposleni</MenuItem>
              {(employeesQuery.data ?? []).map((employee) => (
                <MenuItem key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Resurs</InputLabel>
            <Select label="Resurs" value={resourceId} onChange={(event) => setResourceId(event.target.value)}>
              <MenuItem value="">Svi resursi</MenuItem>
              {(resourcesQuery.data ?? []).map((resource) => (
                <MenuItem key={resource.id} value={resource.id}>
                  {resource.name} ({resource.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus | "")}>
              <MenuItem value="">Svi statusi</MenuItem>
              {Object.entries(taskStatusLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={2} useFlexGap sx={{ mb: 2.5, flexWrap: "wrap" }}>
          {Object.entries(taskStatusLabels).map(([value, label]) => (
            <Stack key={value} direction="row" spacing={0.8} sx={{ alignItems: "center" }}>
              <Box sx={{ width: 11, height: 11, borderRadius: "50%", bgcolor: statusEventColors[value as TaskStatus] }} />
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Stack>
          ))}
        </Stack>

        <Box sx={{ minWidth: 0, "& .fc-event": { cursor: "pointer" }, "& .fc-toolbar-title": { fontSize: { xs: "1rem", md: "1.35rem" } } }}>
          <FullCalendar
            plugins={[themePlugin, dayGridPlugin, timeGridPlugin, interactionPlugin]}
            locale={srLatinLocale}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            eventClick={handleEventClick}
            nowIndicator
            dayMaxEvents
            firstDay={1}
            height="auto"
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
          />
        </Box>
      </Paper>

      <Dialog open={Boolean(selectedTask)} onClose={() => setSelectedTask(null)} fullWidth maxWidth="sm">
        {selectedTask && (
          <>
            <DialogTitle>{selectedTask.title}</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ pt: 1 }}>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                  <Chip size="small" color={taskStatusColors[selectedTask.status]} label={taskStatusLabels[selectedTask.status]} />
                  <Chip size="small" variant="outlined" label={`Prioritet: ${taskPriorityLabels[selectedTask.priority]}`} />
                </Stack>
                <Box>
                  <Typography variant="caption" color="text.secondary">Termin</Typography>
                  <Typography>{formatDate(selectedTask.startsAt)} – {formatDate(selectedTask.dueAt)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Odgovorni zaposleni</Typography>
                  <Typography>
                    {selectedTask.employee
                      ? `${selectedTask.employee.firstName} ${selectedTask.employee.lastName}`
                      : "Nedodeljen"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Potrebni resursi</Typography>
                  <Typography>
                    {selectedTask.reservations.length
                      ? selectedTask.reservations
                          .map((reservation) => `${reservation.quantity} × ${reservation.resource.name}`)
                          .join(", ")
                      : "Bez resursa"}
                  </Typography>
                </Box>
                {selectedTask.description && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Opis</Typography>
                    <Typography>{selectedTask.description}</Typography>
                  </Box>
                )}
                {selectedTask.completedAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Vreme završetka</Typography>
                    <Typography>{formatDate(selectedTask.completedAt)}</Typography>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedTask(null)}>Zatvori</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}
