import { useState } from "react";
import {
  AddRounded,
  AssignmentRounded,
  CheckCircleOutlineRounded,
  DeleteOutlineRounded,
  EditOutlined,
  SearchRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { TaskDialog } from "../components/TaskDialog";
import {
  taskPriorityColors,
  taskPriorityLabels,
  taskStatusColors,
  taskStatusLabels,
} from "../task-options";
import type { Task, TaskPayload, TaskPriority, TaskStatus } from "../types";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("sr-Latn-RS", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Došlo je do neočekivane greške.";

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [notice, setNotice] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);
  const tasksQuery = useQuery({
    queryKey: ["tasks", search, status, priority],
    queryFn: () => api.tasks.list({ search, status, priority }),
  });
  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.employees.list(),
  });
  const resourcesQuery = useQuery({
    queryKey: ["resources"],
    queryFn: () => api.resources.list({}),
  });
  const refresh = async () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["tasks"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["resources"] }),
      queryClient.invalidateQueries({ queryKey: ["employees"] }),
      queryClient.invalidateQueries({ queryKey: ["reservations"] }),
    ]);
  const saveTask = useMutation({
    mutationFn: (payload: TaskPayload) =>
      editingTask
        ? api.tasks.update(editingTask.id, payload)
        : api.tasks.create(payload),
    onSuccess: async () => {
      await refresh();
      setDialogOpen(false);
      setEditingTask(null);
      setNotice({
        message: "Zadatak je uspešno sačuvan.",
        severity: "success",
      });
    },
    onError: (error) =>
      setNotice({ message: getErrorMessage(error), severity: "error" }),
  });
  const deleteTask = useMutation({
    mutationFn: api.tasks.remove,
    onSuccess: async () => {
      await refresh();
      setNotice({ message: "Zadatak je obrisan.", severity: "success" });
    },
    onError: (error) =>
      setNotice({ message: getErrorMessage(error), severity: "error" }),
  });
  const completeTask = useMutation({
    mutationFn: api.tasks.complete,
    onSuccess: async () => {
      await refresh();
      setNotice({ message: "Zadatak je označen kao završen.", severity: "success" });
    },
    onError: (error) =>
      setNotice({ message: getErrorMessage(error), severity: "error" }),
  });
  const tasks = tasksQuery.data ?? [];
  const employees = employeesQuery.data ?? [];
  const resources = resourcesQuery.data ?? [];

  return (
    <Container maxWidth="xl">
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{ justifyContent: "space-between", gap: 2, mb: 3 }}
      >
        <Box>
          <Typography variant="h4">Poslovni zadaci</Typography>
          <Typography color="text.secondary">
            Planiranje obaveza, prioriteta, rokova i potrebnih resursa.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRounded />}
          disabled={
            !employees.some((employee) => employee.status === "ACTIVE") ||
            !resources.some((resource) => resource.status === "AVAILABLE")
          }
          onClick={() => {
            setEditingTask(null);
            setDialogOpen(true);
          }}
        >
          Novi zadatak
        </Button>
      </Stack>
      {!employeesQuery.isLoading &&
        !employees.some((employee) => employee.status === "ACTIVE") && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Pre kreiranja zadatka dodajte najmanje jednog aktivnog zaposlenog.
          </Alert>
        )}
      {!resourcesQuery.isLoading &&
        !resources.some((resource) => resource.status === "AVAILABLE") && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Pre kreiranja zadatka dodajte najmanje jedan dostupan resurs.
          </Alert>
        )}
      <Paper elevation={0} className="resources-panel">
        <Stack
          direction={{ xs: "column", lg: "row" }}
          sx={{ gap: 2 }}
          className="filters"
        >
          <TextField
            size="small"
            placeholder="Pretraži naziv ili opis"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ flex: 1, minWidth: 260 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded />
                  </InputAdornment>
                ),
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as TaskStatus | "")
              }
            >
              <MenuItem value="">Svi statusi</MenuItem>
              {Object.entries(taskStatusLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Prioritet</InputLabel>
            <Select
              label="Prioritet"
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as TaskPriority | "")
              }
            >
              <MenuItem value="">Svi prioriteti</MenuItem>
              {Object.entries(taskPriorityLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        {tasksQuery.isError ? (
          <Alert severity="error" sx={{ m: 3 }}>
            {getErrorMessage(tasksQuery.error)}
          </Alert>
        ) : tasksQuery.isLoading ? (
          <Box className="loading-state">
            <CircularProgress size={32} />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Zadatak</TableCell>
                  <TableCell>Odgovorni</TableCell>
                  <TableCell>Resursi</TableCell>
                  <TableCell>Početak</TableCell>
                  <TableCell>Rok</TableCell>
                  <TableCell>Prioritet</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Akcije</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>
                        {task.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {task.description || "Bez opisa"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {task.employee ? (
                        `${task.employee.firstName} ${task.employee.lastName}`
                      ) : (
                        <Typography color="warning.main" variant="body2">
                          Nedodeljen
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.reservations.length ? (
                        task.reservations
                        .map(
                          (reservation) =>
                            `${reservation.quantity} × ${reservation.resource.name}`,
                        )
                          .join(", ")
                      ) : (
                        <Typography color="warning.main" variant="body2">
                          Bez resursa
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(task.startsAt)}</TableCell>
                    <TableCell>
                      <Typography
                        color={
                          task.status !== "DONE" &&
                          new Date(task.dueAt) < new Date()
                            ? "error"
                            : "inherit"
                        }
                      >
                        {formatDate(task.dueAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={taskPriorityColors[task.priority]}
                        label={taskPriorityLabels[task.priority]}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={taskStatusColors[task.status]}
                        label={taskStatusLabels[task.status]}
                      />
                      {task.status === "DONE" && task.completedAt && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          Završeno: {formatDate(task.completedAt)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {task.status !== "DONE" && (
                        <IconButton
                          aria-label="Označi zadatak kao završen"
                          color="success"
                          disabled={completeTask.isPending}
                          onClick={() => {
                            if (window.confirm(`Označiti zadatak „${task.title}” kao završen?`)) {
                              completeTask.mutate(task.id);
                            }
                          }}
                        >
                          <CheckCircleOutlineRounded />
                        </IconButton>
                      )}
                      <IconButton
                        aria-label="Izmeni zadatak"
                        onClick={() => {
                          setEditingTask(task);
                          setDialogOpen(true);
                        }}
                      >
                        <EditOutlined />
                      </IconButton>
                      <IconButton
                        aria-label="Obriši zadatak"
                        color="error"
                        onClick={() => {
                          if (
                            window.confirm(`Obrisati zadatak „${task.title}”?`)
                          )
                            deleteTask.mutate(task.id);
                        }}
                      >
                        <DeleteOutlineRounded />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!tasks.length && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Box className="empty-state">
                        <AssignmentRounded />
                        <Typography variant="h6">
                          Nema evidentiranih zadataka
                        </Typography>
                        <Typography color="text.secondary">
                          Dodajte prvu poslovnu obavezu.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      {dialogOpen && (
        <TaskDialog
          key={editingTask?.id ?? "new"}
          open
          task={editingTask}
          employees={employees}
          resources={resources}
          saving={saveTask.isPending}
          onClose={() => {
            setDialogOpen(false);
            setEditingTask(null);
          }}
          onSave={(payload) => saveTask.mutate(payload)}
        />
      )}
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4500}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={notice?.severity}
          variant="filled"
          onClose={() => setNotice(null)}
        >
          {notice?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
