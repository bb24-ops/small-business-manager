import {
  ArrowForwardRounded,
  AssignmentRounded,
  CategoryRounded,
  Inventory2Rounded,
  ScheduleRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { api } from "../api";
import { statusColors, statusLabels } from "../resource-status";
import {
  taskPriorityColors,
  taskPriorityLabels,
  taskStatusColors,
  taskStatusLabels,
} from "../task-options";
import type { ResourceStatus } from "../types";
import { ResourceUsageChart } from "../components/ResourceUsageChart";

const statusCards: Array<{
  key: ResourceStatus;
  label: string;
  color: string;
}> = [
  { key: "AVAILABLE", label: "Dostupno", color: "success.main" },
  { key: "IN_USE", label: "U upotrebi", color: "info.main" },
  { key: "MAINTENANCE", label: "Na servisu", color: "warning.main" },
];
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("sr-Latn-RS", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat("sr-Latn-RS", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00Z`));

export default function DashboardPage() {
  const [usageDays, setUsageDays] = useState<7 | 30 | 90>(30);
  const [usageDirection, setUsageDirection] = useState<"past" | "current-week" | "future">("past");
  const navigate = useNavigate();
  const statsQuery = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: api.dashboard.stats,
  });
  const usageQuery = useQuery({
    queryKey: ["dashboard-resource-usage", usageDays, usageDirection],
    queryFn: () => api.dashboard.resourceUsage(usageDays, usageDirection),
  });

  if (statsQuery.isLoading)
    return (
      <Box className="page-loading">
        <CircularProgress />
      </Box>
    );
  if (statsQuery.isError)
    return (
      <Container maxWidth="xl">
        <Alert severity="error">Kontrolna tabla trenutno nije dostupna.</Alert>
      </Container>
    );

  const stats = statsQuery.data!;
  const maxCategoryCount = Math.max(
    ...stats.byCategory.map((item) => item.count),
    1,
  );

  return (
    <Container maxWidth="xl">
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{ justifyContent: "space-between", gap: 2, mb: 3 }}
      >
        <Box>
          <Typography variant="h4">Kontrolna tabla</Typography>
          <Typography color="text.secondary">
            Brzi pregled trenutnog stanja poslovnih resursa.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Inventory2Rounded />}
          onClick={() => navigate("/resources")}
        >
          Upravljaj resursima
        </Button>
      </Stack>

      <Box className="stats-grid dashboard-stats">
        <Paper className="stat-card featured-stat" elevation={0}>
          <Typography color="text.secondary" variant="body2">
            Ukupno resursa
          </Typography>
          <Typography variant="h4">{stats.totalResources}</Typography>
          <Typography variant="caption" color="text.secondary">
            u {stats.totalCategories} kategorija
          </Typography>
        </Paper>
        {statusCards.map((item) => (
          <Paper key={item.key} className="stat-card" elevation={0}>
            <Typography color="text.secondary" variant="body2">
              {item.label}
            </Typography>
            <Typography variant="h4" sx={{ color: item.color }}>
              {stats.byStatus[item.key]}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.totalResources
                ? Math.round(
                    (stats.byStatus[item.key] / stats.totalResources) * 100,
                  )
                : 0}
              % ukupnih resursa
            </Typography>
          </Paper>
        ))}
        <Paper className="stat-card" elevation={0}>
          <Typography color="text.secondary" variant="body2">
            Aktivni zadaci
          </Typography>
          <Typography variant="h4" color="primary.main">
            {stats.taskByStatus.TODO +
              stats.taskByStatus.IN_PROGRESS +
              stats.taskByStatus.OVERDUE}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            od ukupno {stats.totalTasks} zadataka
          </Typography>
        </Paper>
        <Paper className="stat-card" elevation={0}>
          <Typography color="text.secondary" variant="body2">
            Trenutno dostupni zaposleni
          </Typography>
          <Typography variant="h4" color="success.main">
            {stats.availableEmployees}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {stats.busyEmployees} zauzeto · {stats.activeEmployees} aktivno
          </Typography>
        </Paper>
        <Paper className="stat-card" elevation={0}>
          <Typography color="text.secondary" variant="body2">
            Rezervacije
          </Typography>
          <Typography variant="h4" color="info.main">
            {stats.totalReservations}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            evidentiranih korišćenja resursa
          </Typography>
        </Paper>
      </Box>

      <Paper className="dashboard-panel" elevation={0} sx={{ mb: 2.5 }}>
        <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="h6">Iskorišćenost resursa</Typography>
            <Typography variant="body2" color="text.secondary">{usageDirection === "future" ? "Planirani broj istovremeno angažovanih jedinica po danu" : usageDirection === "current-week" ? "Ostvareno i planirano angažovanje od ponedeljka do nedelje" : "Ostvareni broj istovremeno angažovanih jedinica po danu"}</Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: 190 }}><InputLabel>Period</InputLabel><Select label="Period" value={usageDirection === "current-week" ? "current-week" : `${usageDirection}-${usageDays}`} onChange={event => { const value = event.target.value; if (value === "current-week") { setUsageDirection("current-week"); setUsageDays(7); return; } const [direction, days] = value.split("-"); setUsageDirection(direction as "past" | "future"); setUsageDays(Number(days) as 7 | 30 | 90); }}><MenuItem value="past-90">Prethodnih 90 dana</MenuItem><MenuItem value="past-30">Prethodnih 30 dana</MenuItem><MenuItem value="past-7">Prethodnih 7 dana</MenuItem><MenuItem value="current-week">Trenutna nedelja</MenuItem><MenuItem value="future-7">Narednih 7 dana</MenuItem><MenuItem value="future-30">Narednih 30 dana</MenuItem><MenuItem value="future-90">Narednih 90 dana</MenuItem></Select></FormControl>
        </Stack>
        {usageQuery.isLoading ? <Box sx={{ minHeight: 280, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
          : usageQuery.isError ? <Alert severity="error">Statistika iskorišćenosti trenutno nije dostupna.</Alert>
          : usageQuery.data ? <>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mb: 1 }}>
              <Chip color="secondary" label={`${usageDirection === "future" ? "Planirani vrh" : usageDirection === "current-week" ? "Nedeljni vrh" : "Vrh"}: ${usageQuery.data.peak.peakQuantity} jedinica · ${formatShortDate(usageQuery.data.peak.date)}`} />
              <Chip variant="outlined" label={`Dnevni prosek: ${usageQuery.data.averageQuantity}`} />
              <Chip variant="outlined" label={`Ukupan kapacitet: ${usageQuery.data.capacity}`} />
            </Stack>
            <ResourceUsageChart points={usageQuery.data.points} />
          </> : null}
      </Paper>

      <Box sx={{ mb: 2.5 }}>
        <Paper className="dashboard-panel" elevation={0}>
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="h6">Resursi po kategorijama</Typography>
              <Typography variant="body2" color="text.secondary">
                Raspodela evidentiranih sredstava
              </Typography>
            </Box>
            <CategoryRounded color="primary" />
          </Stack>
          <Stack spacing={2.2}>
            {stats.byCategory.length ? (
              stats.byCategory.map((category) => (
                <Box key={category.id}>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between", mb: 0.7 }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {category.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.count}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(category.count / maxCategoryCount) * 100}
                  />
                </Box>
              ))
            ) : (
              <Box className="compact-empty">
                <CategoryRounded />
                <Typography>Nema kreiranih kategorija.</Typography>
              </Box>
            )}
          </Stack>
        </Paper>
      </Box>

      <Paper
        className="dashboard-panel recent-panel"
        elevation={0}
        sx={{ mb: 2.5 }}
      >
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}
        >
          <Box>
              <Typography variant="h6">Aktivni zadaci</Typography>
            <Typography variant="body2" color="text.secondary">
                Nezavršene obaveze poređane prema roku
            </Typography>
          </Box>
          <Button
            endIcon={<ArrowForwardRounded />}
            onClick={() => navigate("/tasks")}
          >
            Prikaži sve
          </Button>
        </Stack>
        {stats.upcomingTasks.length ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Zadatak</TableCell>
                <TableCell>Odgovorni</TableCell>
                <TableCell>Rok</TableCell>
                <TableCell>Prioritet</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.upcomingTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>
                      {task.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {task.employee
                      ? `${task.employee.firstName} ${task.employee.lastName}`
                      : "Nedodeljen"}
                  </TableCell>
                  <TableCell>{formatDate(task.dueAt)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      variant="outlined"
                      color={taskPriorityColors[task.priority]}
                      label={taskPriorityLabels[task.priority]}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={taskStatusColors[task.status]}
                      label={taskStatusLabels[task.status]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Box className="compact-empty">
            <AssignmentRounded />
            <Typography>Nema aktivnih zadataka.</Typography>
            <Button onClick={() => navigate("/tasks")}>
              Dodaj prvi zadatak
            </Button>
          </Box>
        )}
      </Paper>

      <Paper
        className="dashboard-panel recent-panel"
        elevation={0}
        sx={{ mb: 2.5 }}
      >
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}
        >
          <Box>
            <Typography variant="h6">Predstojeće rezervacije</Typography>
            <Typography variant="body2" color="text.secondary">
              Najbliža planirana korišćenja resursa
            </Typography>
          </Box>
          <Button
            endIcon={<ArrowForwardRounded />}
            onClick={() => navigate("/reservations")}
          >
            Prikaži sve
          </Button>
        </Stack>
        {stats.upcomingReservations.length ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Resurs</TableCell>
                <TableCell>Količina</TableCell>
                <TableCell>Zadatak</TableCell>
                <TableCell>Odgovorni</TableCell>
                <TableCell>Termin</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.upcomingReservations.map((reservation) => (
                <TableRow key={reservation.id}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>
                      {reservation.resource.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {reservation.resource.code}
                    </Typography>
                  </TableCell>
                  <TableCell>{reservation.quantity}</TableCell>
                  <TableCell>{reservation.task.title}</TableCell>
                  <TableCell>
                    {reservation.task.employee
                      ? `${reservation.task.employee.firstName} ${reservation.task.employee.lastName}`
                      : "Nedodeljen"}
                  </TableCell>
                  <TableCell>
                    {formatDate(reservation.startsAt)} –{" "}
                    {formatDate(reservation.endsAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Box className="compact-empty">
            <ScheduleRounded />
            <Typography>Nema predstojećih rezervacija.</Typography>
            <Button onClick={() => navigate("/tasks")}>Otvori zadatke</Button>
          </Box>
        )}
      </Paper>

      <Paper className="dashboard-panel recent-panel" elevation={0}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}
        >
          <Box>
            <Typography variant="h6">Nedavno ažurirani resursi</Typography>
            <Typography variant="body2" color="text.secondary">
              Poslednjih pet promenjenih stavki
            </Typography>
          </Box>
          <Button
            endIcon={<ArrowForwardRounded />}
            onClick={() => navigate("/resources")}
          >
            Prikaži sve
          </Button>
        </Stack>
        {stats.recentResources.length ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Naziv</TableCell>
                <TableCell>Količina</TableCell>
                <TableCell>Kategorija</TableCell>
                <TableCell>Lokacija</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.recentResources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>
                      {resource.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {resource.code}
                    </Typography>
                  </TableCell>
                  <TableCell>{resource.quantity}</TableCell>
                  <TableCell>{resource.category.name}</TableCell>
                  <TableCell>{resource.location || "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                        color={statusColors[resource.currentStatus]}
                        label={statusLabels[resource.currentStatus]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Box className="compact-empty">
            <Inventory2Rounded />
            <Typography>Nema evidentiranih resursa.</Typography>
            <Button onClick={() => navigate("/resources")}>
              Dodaj prvi resurs
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
