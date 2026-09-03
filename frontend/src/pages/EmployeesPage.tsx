import { useState } from "react";
import {
  AddRounded,
  DeleteOutlineRounded,
  EditOutlined,
  GroupsRounded,
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
import { EmployeeDialog } from "../components/EmployeeDialog";
import {
  employeeStatusColors,
  employeeStatusLabels,
} from "../employee-options";
import type { Employee, EmployeePayload, EmployeeStatus } from "../types";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Došlo je do neočekivane greške.";

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EmployeeStatus | "">("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [notice, setNotice] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);
  const employeesQuery = useQuery({
    queryKey: ["employees", search, status],
    queryFn: () => api.employees.list({ search, status }),
  });
  const refresh = async () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["employees"] }),
      queryClient.invalidateQueries({ queryKey: ["tasks"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
    ]);
  const saveEmployee = useMutation({
    mutationFn: (payload: EmployeePayload) =>
      editingEmployee
        ? api.employees.update(editingEmployee.id, payload)
        : api.employees.create(payload),
    onSuccess: async () => {
      await refresh();
      setDialogOpen(false);
      setEditingEmployee(null);
      setNotice({
        message: "Zaposleni je uspešno sačuvan.",
        severity: "success",
      });
    },
    onError: (error) =>
      setNotice({ message: getErrorMessage(error), severity: "error" }),
  });
  const deleteEmployee = useMutation({
    mutationFn: api.employees.remove,
    onSuccess: async () => {
      await refresh();
      setNotice({ message: "Zaposleni je obrisan.", severity: "success" });
    },
    onError: (error) =>
      setNotice({ message: getErrorMessage(error), severity: "error" }),
  });
  const employees = employeesQuery.data ?? [];

  return (
    <Container maxWidth="xl">
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{ justifyContent: "space-between", gap: 2, mb: 3 }}
      >
        <Box>
          <Typography variant="h4">Zaposleni</Typography>
          <Typography color="text.secondary">
            Evidencija članova tima i njihovih poslovnih zaduženja.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() => {
            setEditingEmployee(null);
            setDialogOpen(true);
          }}
        >
          Novi zaposleni
        </Button>
      </Stack>
      <Paper elevation={0} className="resources-panel">
        <Stack
          direction={{ xs: "column", md: "row" }}
          sx={{ gap: 2 }}
          className="filters"
        >
          <TextField
            size="small"
            placeholder="Pretraži ime, email ili poziciju"
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
                setStatus(event.target.value as EmployeeStatus | "")
              }
            >
              <MenuItem value="">Svi statusi</MenuItem>
              {Object.entries(employeeStatusLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        {employeesQuery.isError ? (
          <Alert severity="error" sx={{ m: 3 }}>
            {getErrorMessage(employeesQuery.error)}
          </Alert>
        ) : employeesQuery.isLoading ? (
          <Box className="loading-state">
            <CircularProgress size={32} />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Zaposleni</TableCell>
                  <TableCell>Kontakt</TableCell>
                  <TableCell>Pozicija</TableCell>
                  <TableCell>Zadaci</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Akcije</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>
                        {employee.firstName} {employee.lastName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{employee.email}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {employee.phone || "Bez telefona"}
                      </Typography>
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee._count?.tasks ?? 0}</TableCell>
                    <TableCell>
                        {employee.status === "ACTIVE" && employee.isCurrentlyBusy ? (
                          <Box>
                            <Chip size="small" color="info" label="Zauzet" />
                            {employee.currentTask && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                {employee.currentTask.title}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Chip
                            size="small"
                            color={employeeStatusColors[employee.status]}
                            label={employee.status === "ACTIVE" ? "Dostupan" : employeeStatusLabels[employee.status]}
                          />
                        )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label="Izmeni zaposlenog"
                        onClick={() => {
                          setEditingEmployee(employee);
                          setDialogOpen(true);
                        }}
                      >
                        <EditOutlined />
                      </IconButton>
                      <IconButton
                        aria-label="Obriši zaposlenog"
                        color="error"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Obrisati zaposlenog „${employee.firstName} ${employee.lastName}”?`,
                            )
                          )
                            deleteEmployee.mutate(employee.id);
                        }}
                      >
                        <DeleteOutlineRounded />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!employees.length && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box className="empty-state">
                        <GroupsRounded />
                        <Typography variant="h6">
                          Nema evidentiranih zaposlenih
                        </Typography>
                        <Typography color="text.secondary">
                          Dodajte prvog člana tima.
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
        <EmployeeDialog
          key={editingEmployee?.id ?? "new"}
          open
          employee={editingEmployee}
          saving={saveEmployee.isPending}
          onClose={() => {
            setDialogOpen(false);
            setEditingEmployee(null);
          }}
          onSave={(payload) => saveEmployee.mutate(payload)}
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
