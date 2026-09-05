import { useState } from "react";
import { AddRounded, ManageAccountsRounded } from "@mui/icons-material";
import { Alert, Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { UserRole } from "../types";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("EMPLOYEE"); const [employeeId, setEmployeeId] = useState("");
  const users = useQuery({ queryKey: ["users"], queryFn: api.users.list });
  const employees = useQuery({ queryKey: ["employees"], queryFn: () => api.employees.list() });
  const create = useMutation({ mutationFn: api.users.create, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["users"] }); setOpen(false); setEmail(""); setPassword(""); setEmployeeId(""); }, });
  const toggle = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.users.update(id, { isActive }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }) });
  const availableEmployees = (employees.data ?? []).filter(employee => !(users.data ?? []).some(user => user.employeeId === employee.id));
  return <Container maxWidth="xl">
    <Stack direction={{ xs: "column", md: "row" }} sx={{ justifyContent: "space-between", gap: 2, mb: 3 }}>
      <Box><Typography variant="h4">Korisnički nalozi</Typography><Typography color="text.secondary">Pristup sistemu i korisničke uloge.</Typography></Box>
      <Button variant="contained" startIcon={<AddRounded />} onClick={() => setOpen(true)}>Novi nalog</Button>
    </Stack>
    {(users.error || employees.error) && <Alert severity="error" sx={{ mb: 2 }}>{users.error instanceof Error ? users.error.message : "Podaci nisu dostupni."}</Alert>}
    <Paper elevation={0} className="resources-panel"><TableContainer><Table><TableHead><TableRow><TableCell>Email</TableCell><TableCell>Uloga</TableCell><TableCell>Zaposleni</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>
      {(users.data ?? []).map(user => <TableRow key={user.id}><TableCell>{user.email}</TableCell><TableCell><Chip size="small" label={user.role === "ADMIN" ? "Administrator" : "Zaposleni"} color={user.role === "ADMIN" ? "primary" : "default"} /></TableCell><TableCell>{user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : "—"}</TableCell><TableCell><Stack direction="row" sx={{ alignItems: "center" }}><Switch checked={user.isActive} disabled={toggle.isPending} onChange={(_, checked) => toggle.mutate({ id: user.id, isActive: checked })} /><Typography variant="body2">{user.isActive ? "Aktivan" : "Neaktivan"}</Typography></Stack></TableCell></TableRow>)}
      {!users.isLoading && !users.data?.length && <TableRow><TableCell colSpan={4}><Box className="empty-state"><ManageAccountsRounded /><Typography>Nema korisničkih naloga</Typography></Box></TableCell></TableRow>}
    </TableBody></Table></TableContainer></Paper>
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"><DialogTitle>Novi korisnički nalog</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      {create.error && <Alert severity="error">{create.error.message}</Alert>}
      <TextField label="Email adresa" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
      <TextField label="Početna lozinka" type="password" required helperText="Najmanje 8 znakova" value={password} onChange={e => setPassword(e.target.value)} />
      <FormControl><InputLabel>Uloga</InputLabel><Select label="Uloga" value={role} onChange={e => { const value = e.target.value as UserRole; setRole(value); if (value === "ADMIN") setEmployeeId(""); }}><MenuItem value="ADMIN">Administrator</MenuItem><MenuItem value="EMPLOYEE">Zaposleni</MenuItem></Select></FormControl>
      {role === "EMPLOYEE" && <FormControl required><InputLabel>Zaposleni</InputLabel><Select label="Zaposleni" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>{availableEmployees.map(employee => <MenuItem key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</MenuItem>)}</Select></FormControl>}
    </Stack></DialogContent><DialogActions><Button onClick={() => setOpen(false)}>Otkaži</Button><Button variant="contained" disabled={create.isPending || !email || password.length < 8 || (role === "EMPLOYEE" && !employeeId)} onClick={() => create.mutate({ email, password, role, employeeId: employeeId || undefined })}>Sačuvaj</Button></DialogActions></Dialog>
  </Container>;
}
