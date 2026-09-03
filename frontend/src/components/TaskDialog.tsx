import { useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material'
import { taskPriorityLabels, taskStatusLabels } from '../task-options'
import type { Employee, Resource, ResourceAllocation, Task, TaskPayload, TaskPriority, TaskStatus } from '../types'

const toLocalInput = (value: string) => {
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

const defaultPeriod = () => {
  const startsAt = new Date()
  startsAt.setMinutes(Math.ceil(startsAt.getMinutes() / 15) * 15, 0, 0)
  const dueAt = new Date(startsAt.getTime() + 60 * 60 * 1000)
  return { startsAt: toLocalInput(startsAt.toISOString()), dueAt: toLocalInput(dueAt.toISOString()) }
}

interface TaskForm { title: string; description: string; startsAt: string; dueAt: string; priority: TaskPriority; status: TaskStatus; employeeId: string; resources: ResourceAllocation[] }
interface Props { open: boolean; task: Task | null; employees: Employee[]; resources: Resource[]; saving: boolean; onClose: () => void; onSave: (payload: TaskPayload) => void }

export function TaskDialog({ open, task, employees, resources, saving, onClose, onSave }: Props) {
  const [form, setForm] = useState<TaskForm>(() => task ? {
    title: task.title,
    description: task.description ?? '',
    startsAt: toLocalInput(task.startsAt),
    dueAt: toLocalInput(task.dueAt),
    priority: task.priority,
    status: task.status,
    employeeId: task.employeeId ?? '',
    resources: task.reservations.map((reservation) => ({ resourceId: reservation.resourceId, quantity: reservation.quantity })),
  } : { title: '', description: '', priority: 'MEDIUM', status: 'TODO', employeeId: employees.find((employee) => employee.status === 'ACTIVE')?.id ?? '', resources: [], ...defaultPeriod() })
  const valid = form.title.trim().length >= 2 && Boolean(form.employeeId) && form.resources.length > 0 && form.resources.every((allocation) => allocation.quantity >= 1 && allocation.quantity <= (resources.find((resource) => resource.id === allocation.resourceId)?.quantity ?? 0)) && Boolean(form.startsAt) && Boolean(form.dueAt) && new Date(form.dueAt) > new Date(form.startsAt)

  return <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm"><DialogTitle>{task ? 'Izmena zadatka' : 'Novi zadatak'}</DialogTitle><DialogContent><Stack spacing={2.2} sx={{ pt: 1 }}>
    <TextField label="Naziv zadatka" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
    <TextField label="Opis" multiline minRows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
    <FormControl required><InputLabel>Odgovorni zaposleni</InputLabel><Select label="Odgovorni zaposleni" value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })}>{employees.map((employee) => <MenuItem key={employee.id} value={employee.id} disabled={employee.status === 'INACTIVE'}>{employee.firstName} {employee.lastName} — {employee.position}{employee.status === 'INACTIVE' ? ' (neaktivan)' : ''}</MenuItem>)}</Select></FormControl>
    <FormControl required><InputLabel>Potrebni resursi</InputLabel><Select multiple label="Potrebni resursi" value={form.resources.map((allocation) => allocation.resourceId)} onChange={(event) => { const selected = event.target.value as string[]; setForm({ ...form, resources: selected.map((resourceId) => form.resources.find((allocation) => allocation.resourceId === resourceId) ?? { resourceId, quantity: 1 }) }) }} renderValue={(selected) => selected.map((id) => resources.find((resource) => resource.id === id)?.name).filter(Boolean).join(', ')}>{resources.map((resource) => <MenuItem key={resource.id} value={resource.id} disabled={resource.status !== 'AVAILABLE'}>{resource.name} ({resource.code}) — ukupno {resource.quantity}{resource.status !== 'AVAILABLE' ? ' · nije dostupan' : ''}</MenuItem>)}</Select></FormControl>
    {form.resources.map((allocation) => { const resource = resources.find((item) => item.id === allocation.resourceId); return <TextField key={allocation.resourceId} label={`Potrebna količina — ${resource?.name ?? 'resurs'}`} type="number" required value={allocation.quantity} onChange={(event) => setForm({ ...form, resources: form.resources.map((item) => item.resourceId === allocation.resourceId ? { ...item, quantity: Number(event.target.value) } : item) })} helperText={`Ukupno evidentirano: ${resource?.quantity ?? 0}`} slotProps={{ htmlInput: { min: 1, max: resource?.quantity ?? 1, step: 1 } }} /> })}
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><TextField label="Početak" type="datetime-local" required fullWidth value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} /><TextField label="Rok" type="datetime-local" required fullWidth value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} /></Stack>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><FormControl fullWidth><InputLabel>Prioritet</InputLabel><Select label="Prioritet" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as TaskPriority })}>{Object.entries(taskPriorityLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</Select></FormControl><FormControl fullWidth><InputLabel>Status</InputLabel><Select label="Status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as TaskStatus })}>{Object.entries(taskStatusLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</Select></FormControl></Stack>
  </Stack></DialogContent><DialogActions sx={{ px: 3, pb: 2.5 }}><Button onClick={onClose} disabled={saving}>Otkaži</Button><Button variant="contained" disabled={!valid || saving} onClick={() => onSave({ ...form, startsAt: new Date(form.startsAt).toISOString(), dueAt: new Date(form.dueAt).toISOString() })}>{saving ? 'Čuvanje...' : 'Sačuvaj'}</Button></DialogActions></Dialog>
}
