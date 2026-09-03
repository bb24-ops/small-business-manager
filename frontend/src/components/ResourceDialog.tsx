import { useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material'
import type { Resource, ResourceCategory, ResourcePayload, ResourceStatus } from '../types'

const emptyForm: ResourcePayload = { name: '', code: '', description: '', location: '', status: 'AVAILABLE', quantity: 1, categoryId: '' }
const statuses: Array<{ value: ResourceStatus; label: string }> = [{ value: 'AVAILABLE', label: 'Dostupan' }, { value: 'IN_USE', label: 'U upotrebi' }, { value: 'MAINTENANCE', label: 'Na servisu' }, { value: 'UNAVAILABLE', label: 'Nedostupan' }]
interface Props { open: boolean; resource: Resource | null; categories: ResourceCategory[]; saving: boolean; onClose: () => void; onSave: (payload: ResourcePayload) => void }

export function ResourceDialog({ open, resource, categories, saving, onClose, onSave }: Props) {
  const [form, setForm] = useState<ResourcePayload>(() => resource ? { name: resource.name, code: resource.code, description: resource.description ?? '', location: resource.location ?? '', status: resource.status, quantity: resource.quantity, categoryId: resource.categoryId } : { ...emptyForm, categoryId: categories[0]?.id ?? '' })
  const valid = form.name.trim().length >= 2 && form.code.trim().length >= 2 && form.quantity >= 1 && Boolean(form.categoryId)
  return <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm"><DialogTitle>{resource ? 'Izmena resursa' : 'Novi resurs'}</DialogTitle><DialogContent><Stack spacing={2.2} sx={{ pt: 1 }}>
    <TextField label="Naziv" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
    <TextField label="Interna šifra" required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
    <TextField label="Ukupna količina" type="number" required value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} slotProps={{ htmlInput: { min: 1, step: 1 } }} />
    <FormControl required><InputLabel>Kategorija</InputLabel><Select label="Kategorija" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>{categories.map((category) => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}</Select></FormControl>
    <FormControl><InputLabel>Status</InputLabel><Select label="Status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ResourceStatus })}>{statuses.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</Select></FormControl>
    <TextField label="Lokacija" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
    <TextField label="Opis" multiline minRows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
  </Stack></DialogContent><DialogActions sx={{ px: 3, pb: 2.5 }}><Button onClick={onClose} disabled={saving}>Otkaži</Button><Button variant="contained" disabled={!valid || saving} onClick={() => onSave(form)}>{saving ? 'Čuvanje...' : 'Sačuvaj'}</Button></DialogActions></Dialog>
}
