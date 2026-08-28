import { useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'
interface Props { open: boolean; saving: boolean; onClose: () => void; onSave: (payload: { name: string; description?: string }) => void }
export function CategoryDialog({ open, saving, onClose, onSave }: Props) {
  const [name, setName] = useState(''); const [description, setDescription] = useState('')
  return <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs"><DialogTitle>Nova kategorija</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}><TextField autoFocus required label="Naziv kategorije" value={name} onChange={(event) => setName(event.target.value)} /><TextField label="Opis" multiline minRows={3} value={description} onChange={(event) => setDescription(event.target.value)} /></Stack></DialogContent><DialogActions sx={{ px: 3, pb: 2.5 }}><Button onClick={onClose} disabled={saving}>Otkaži</Button><Button variant="contained" disabled={name.trim().length < 2 || saving} onClick={() => onSave({ name: name.trim(), description: description.trim() || undefined })}>{saving ? 'Čuvanje...' : 'Sačuvaj'}</Button></DialogActions></Dialog>
}
