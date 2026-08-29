import { useState } from 'react'
import { EventBusyRounded } from '@mui/icons-material'
import { Alert, Box, Chip, CircularProgress, Container, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { taskStatusColors, taskStatusLabels } from '../task-options'

const formatDate = (value: string) => new Intl.DateTimeFormat('sr-Latn-RS', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : 'Došlo je do neočekivane greške.'

export default function ReservationsPage() {
  const [resourceId, setResourceId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const resourcesQuery = useQuery({ queryKey: ['resources'], queryFn: () => api.resources.list({}) })
  const reservationsQuery = useQuery({ queryKey: ['reservations', resourceId, from, to], queryFn: () => api.reservations.list({ resourceId, from, to }), enabled: !from || !to || new Date(to) > new Date(from) })
  const resources = resourcesQuery.data ?? []
  const reservations = reservationsQuery.data ?? []
  const invalidPeriod = Boolean(from && to && new Date(to) <= new Date(from))

  return <Container maxWidth="xl"><Box sx={{ mb: 3 }}><Typography variant="h4">Rezervacije resursa</Typography><Typography color="text.secondary">Pregled korišćenja resursa prema zadacima i vremenskom periodu.</Typography></Box>
    <Paper elevation={0} className="resources-panel"><Stack direction={{ xs: 'column', lg: 'row' }} sx={{ gap: 2 }} className="filters"><FormControl size="small" sx={{ minWidth: 240 }}><InputLabel>Resurs</InputLabel><Select label="Resurs" value={resourceId} onChange={(event) => setResourceId(event.target.value)}><MenuItem value="">Svi resursi</MenuItem>{resources.map((resource) => <MenuItem key={resource.id} value={resource.id}>{resource.name} ({resource.code})</MenuItem>)}</Select></FormControl><TextField size="small" label="Od" type="datetime-local" value={from} onChange={(event) => setFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /><TextField size="small" label="Do" type="datetime-local" value={to} onChange={(event) => setTo(event.target.value)} error={invalidPeriod} helperText={invalidPeriod ? 'Kraj mora biti nakon početka.' : undefined} /></Stack>
      {reservationsQuery.isError ? <Alert severity="error" sx={{ m: 3 }}>{getErrorMessage(reservationsQuery.error)}</Alert> : reservationsQuery.isLoading ? <Box className="loading-state"><CircularProgress size={32} /></Box> : <TableContainer><Table><TableHead><TableRow><TableCell>Resurs</TableCell><TableCell>Zadatak</TableCell><TableCell>Odgovorni</TableCell><TableCell>Početak</TableCell><TableCell>Kraj</TableCell><TableCell>Status zadatka</TableCell></TableRow></TableHead><TableBody>{reservations.map((reservation) => <TableRow key={reservation.id} hover><TableCell><Typography sx={{ fontWeight: 600 }}>{reservation.resource.name}</Typography><Typography variant="caption" color="text.secondary">{reservation.resource.code} · {reservation.resource.category.name}</Typography></TableCell><TableCell>{reservation.task.title}</TableCell><TableCell>{reservation.task.employee ? `${reservation.task.employee.firstName} ${reservation.task.employee.lastName}` : 'Nedodeljen'}</TableCell><TableCell>{formatDate(reservation.startsAt)}</TableCell><TableCell>{formatDate(reservation.endsAt)}</TableCell><TableCell><Chip size="small" color={taskStatusColors[reservation.task.status]} label={taskStatusLabels[reservation.task.status]} /></TableCell></TableRow>)}{!reservations.length && <TableRow><TableCell colSpan={6}><Box className="empty-state"><EventBusyRounded /><Typography variant="h6">Nema rezervacija</Typography><Typography color="text.secondary">Rezervacije nastaju kada zadatku dodelite resurse.</Typography></Box></TableCell></TableRow>}</TableBody></Table></TableContainer>}
    </Paper>
  </Container>
}
