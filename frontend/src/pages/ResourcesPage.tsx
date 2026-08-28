import { useState } from 'react'
import { AddRounded, CategoryRounded, DeleteOutlineRounded, EditOutlined, Inventory2Rounded, SearchRounded } from '@mui/icons-material'
import { Alert, Box, Button, Chip, CircularProgress, Container, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Paper, Select, Snackbar, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { CategoryDialog } from '../components/CategoryDialog'
import { ResourceDialog } from '../components/ResourceDialog'
import { statusColors, statusLabels } from '../resource-status'
import type { Resource, ResourcePayload, ResourceStatus } from '../types'

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : 'Došlo je do neočekivane greške.'

export default function ResourcesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ResourceStatus | ''>('')
  const [categoryId, setCategoryId] = useState('')
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [notice, setNotice] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: api.categories.list })
  const resourcesQuery = useQuery({ queryKey: ['resources', search, status, categoryId], queryFn: () => api.resources.list({ search, status, categoryId }) })
  const refreshResources = async () => Promise.all([queryClient.invalidateQueries({ queryKey: ['resources'] }), queryClient.invalidateQueries({ queryKey: ['categories'] }), queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })])

  const saveResource = useMutation({ mutationFn: (payload: ResourcePayload) => editingResource ? api.resources.update(editingResource.id, payload) : api.resources.create(payload), onSuccess: async () => { await refreshResources(); setResourceDialogOpen(false); setEditingResource(null); setNotice({ message: 'Resurs je uspešno sačuvan.', severity: 'success' }) }, onError: (error) => setNotice({ message: getErrorMessage(error), severity: 'error' }) })
  const deleteResource = useMutation({ mutationFn: api.resources.remove, onSuccess: async () => { await refreshResources(); setNotice({ message: 'Resurs je obrisan.', severity: 'success' }) }, onError: (error) => setNotice({ message: getErrorMessage(error), severity: 'error' }) })
  const createCategory = useMutation({ mutationFn: api.categories.create, onSuccess: async () => { await refreshResources(); setCategoryDialogOpen(false); setNotice({ message: 'Kategorija je uspešno dodata.', severity: 'success' }) }, onError: (error) => setNotice({ message: getErrorMessage(error), severity: 'error' }) })

  const resources = resourcesQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const openCreateResource = () => { if (!categories.length) { setNotice({ message: 'Prvo dodajte najmanje jednu kategoriju.', severity: 'error' }); setCategoryDialogOpen(true); return } setEditingResource(null); setResourceDialogOpen(true) }

  return <Container maxWidth="xl">
    <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', gap: 2, mb: 3 }}><Box><Typography variant="h4">Poslovni resursi</Typography><Typography color="text.secondary">Evidencija opreme, vozila, prostorija i drugih sredstava.</Typography></Box><Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}><Button variant="outlined" startIcon={<CategoryRounded />} onClick={() => setCategoryDialogOpen(true)}>Nova kategorija</Button><Button variant="contained" startIcon={<AddRounded />} onClick={openCreateResource}>Novi resurs</Button></Stack></Stack>
    <Paper elevation={0} className="resources-panel"><Stack direction={{ xs: 'column', lg: 'row' }} sx={{ gap: 2 }} className="filters"><TextField size="small" placeholder="Pretraži naziv, šifru ili lokaciju" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ flex: 1, minWidth: 260 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> } }} /><FormControl size="small" sx={{ minWidth: 180 }}><InputLabel>Status</InputLabel><Select label="Status" value={status} onChange={(event) => setStatus(event.target.value as ResourceStatus | '')}><MenuItem value="">Svi statusi</MenuItem>{Object.entries(statusLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</Select></FormControl><FormControl size="small" sx={{ minWidth: 190 }}><InputLabel>Kategorija</InputLabel><Select label="Kategorija" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><MenuItem value="">Sve kategorije</MenuItem>{categories.map((category) => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}</Select></FormControl></Stack>
      {resourcesQuery.isError ? <Alert severity="error" sx={{ m: 3 }}>{getErrorMessage(resourcesQuery.error)}</Alert> : resourcesQuery.isLoading ? <Box className="loading-state"><CircularProgress size={32} /></Box> : <TableContainer><Table><TableHead><TableRow><TableCell>Naziv resursa</TableCell><TableCell>Šifra</TableCell><TableCell>Kategorija</TableCell><TableCell>Lokacija</TableCell><TableCell>Status</TableCell><TableCell align="right">Akcije</TableCell></TableRow></TableHead><TableBody>{resources.map((resource) => <TableRow key={resource.id} hover><TableCell><Typography sx={{ fontWeight: 600 }}>{resource.name}</Typography><Typography variant="caption" color="text.secondary">{resource.description || 'Bez opisa'}</Typography></TableCell><TableCell>{resource.code}</TableCell><TableCell>{resource.category.name}</TableCell><TableCell>{resource.location || '—'}</TableCell><TableCell><Chip size="small" color={statusColors[resource.status]} label={statusLabels[resource.status]} /></TableCell><TableCell align="right"><IconButton aria-label="Izmeni resurs" onClick={() => { setEditingResource(resource); setResourceDialogOpen(true) }}><EditOutlined /></IconButton><IconButton aria-label="Obriši resurs" color="error" onClick={() => { if (window.confirm(`Obrisati resurs „${resource.name}”?`)) deleteResource.mutate(resource.id) }}><DeleteOutlineRounded /></IconButton></TableCell></TableRow>)}{!resources.length && <TableRow><TableCell colSpan={6}><Box className="empty-state"><Inventory2Rounded /><Typography variant="h6">Nema evidentiranih resursa</Typography><Typography color="text.secondary">Dodajte kategoriju i prvi poslovni resurs.</Typography></Box></TableCell></TableRow>}</TableBody></Table></TableContainer>}
    </Paper>
    {resourceDialogOpen && <ResourceDialog key={editingResource?.id ?? 'new'} open resource={editingResource} categories={categories} saving={saveResource.isPending} onClose={() => { setResourceDialogOpen(false); setEditingResource(null) }} onSave={(payload) => saveResource.mutate(payload)} />}
    {categoryDialogOpen && <CategoryDialog open saving={createCategory.isPending} onClose={() => setCategoryDialogOpen(false)} onSave={(payload) => createCategory.mutate(payload)} />}
    <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Alert severity={notice?.severity} variant="filled" onClose={() => setNotice(null)}>{notice?.message}</Alert></Snackbar>
  </Container>
}
