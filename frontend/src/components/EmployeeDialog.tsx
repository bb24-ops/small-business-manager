import { useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material'
import { employeeStatusLabels } from '../employee-options'
import type { Employee, EmployeePayload, EmployeeStatus } from '../types'

const emptyForm: EmployeePayload = { firstName: '', lastName: '', email: '', phone: '', position: '', status: 'ACTIVE' }
interface Props { open: boolean; employee: Employee | null; saving: boolean; onClose: () => void; onSave: (payload: EmployeePayload) => void }

export function EmployeeDialog({ open, employee, saving, onClose, onSave }: Props) {
  const [form, setForm] = useState<EmployeePayload>(() => employee ? { firstName: employee.firstName, lastName: employee.lastName, email: employee.email, phone: employee.phone ?? '', position: employee.position, status: employee.status } : emptyForm)
  const valid = form.firstName.trim().length >= 2 && form.lastName.trim().length >= 2 && form.position.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  return <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm"><DialogTitle>{employee ? 'Izmena zaposlenog' : 'Novi zaposleni'}</DialogTitle><DialogContent><Stack spacing={2.2} sx={{ pt: 1 }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><TextField label="Ime" required fullWidth value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /><TextField label="Prezime" required fullWidth value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></Stack>
    <TextField label="Email" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
    <TextField label="Telefon" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
    <TextField label="Pozicija" required value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} />
    <FormControl><InputLabel>Status</InputLabel><Select label="Status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as EmployeeStatus })}>{Object.entries(employeeStatusLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</Select></FormControl>
  </Stack></DialogContent><DialogActions sx={{ px: 3, pb: 2.5 }}><Button onClick={onClose} disabled={saving}>Otkaži</Button><Button variant="contained" disabled={!valid || saving} onClick={() => onSave(form)}>{saving ? 'Čuvanje...' : 'Sačuvaj'}</Button></DialogActions></Dialog>
}
