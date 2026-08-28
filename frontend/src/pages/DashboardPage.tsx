import { ArrowForwardRounded, AssignmentRounded, CategoryRounded, GroupsRounded, Inventory2Rounded, ScheduleRounded } from '@mui/icons-material'
import { Alert, Box, Button, Chip, CircularProgress, Container, LinearProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { api } from '../api'
import { statusColors, statusLabels } from '../resource-status'
import type { ResourceStatus } from '../types'

const statusCards: Array<{ key: ResourceStatus; label: string; color: string }> = [
  { key: 'AVAILABLE', label: 'Dostupno', color: 'success.main' },
  { key: 'IN_USE', label: 'U upotrebi', color: 'info.main' },
  { key: 'MAINTENANCE', label: 'Na servisu', color: 'warning.main' },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const statsQuery = useQuery({ queryKey: ['dashboard-stats'], queryFn: api.dashboard.stats })

  if (statsQuery.isLoading) return <Box className="page-loading"><CircularProgress /></Box>
  if (statsQuery.isError) return <Container maxWidth="xl"><Alert severity="error">Kontrolna tabla trenutno nije dostupna.</Alert></Container>

  const stats = statsQuery.data!
  const maxCategoryCount = Math.max(...stats.byCategory.map((item) => item.count), 1)

  return <Container maxWidth="xl">
    <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', gap: 2, mb: 3 }}>
      <Box><Typography variant="h4">Kontrolna tabla</Typography><Typography color="text.secondary">Brzi pregled trenutnog stanja poslovnih resursa.</Typography></Box>
      <Button variant="contained" startIcon={<Inventory2Rounded />} onClick={() => navigate('/resources')}>Upravljaj resursima</Button>
    </Stack>

    <Box className="stats-grid dashboard-stats">
      <Paper className="stat-card featured-stat" elevation={0}><Typography color="text.secondary" variant="body2">Ukupno resursa</Typography><Typography variant="h4">{stats.totalResources}</Typography><Typography variant="caption" color="text.secondary">u {stats.totalCategories} kategorija</Typography></Paper>
      {statusCards.map((item) => <Paper key={item.key} className="stat-card" elevation={0}><Typography color="text.secondary" variant="body2">{item.label}</Typography><Typography variant="h4" sx={{ color: item.color }}>{stats.byStatus[item.key]}</Typography><Typography variant="caption" color="text.secondary">{stats.totalResources ? Math.round((stats.byStatus[item.key] / stats.totalResources) * 100) : 0}% ukupnih resursa</Typography></Paper>)}
    </Box>

    <Box className="dashboard-grid">
      <Paper className="dashboard-panel" elevation={0}><Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}><Box><Typography variant="h6">Resursi po kategorijama</Typography><Typography variant="body2" color="text.secondary">Raspodela evidentiranih sredstava</Typography></Box><CategoryRounded color="primary" /></Stack>
        <Stack spacing={2.2}>{stats.byCategory.length ? stats.byCategory.map((category) => <Box key={category.id}><Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.7 }}><Typography variant="body2" sx={{ fontWeight: 600 }}>{category.name}</Typography><Typography variant="body2" color="text.secondary">{category.count}</Typography></Stack><LinearProgress variant="determinate" value={(category.count / maxCategoryCount) * 100} /></Box>) : <Box className="compact-empty"><CategoryRounded /><Typography>Nema kreiranih kategorija.</Typography></Box>}</Stack>
      </Paper>

      <Paper className="dashboard-panel roadmap-panel" elevation={0}><Typography variant="h6">Razvoj sistema</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>Moduli planirani u narednim iteracijama</Typography><Stack spacing={1.5}>
        {[{ icon: <GroupsRounded />, title: 'Korisnici i zaposleni', text: 'Uloge i kontrola pristupa' }, { icon: <AssignmentRounded />, title: 'Zadaci', text: 'Dodela, prioriteti i rokovi' }, { icon: <ScheduleRounded />, title: 'Rezervacije', text: 'Dostupnost i sprečavanje konflikata' }].map((item) => <Box className="roadmap-item" key={item.title}>{item.icon}<Box><Typography sx={{ fontWeight: 600 }}>{item.title}</Typography><Typography variant="caption" color="text.secondary">{item.text}</Typography></Box><Chip label="Planirano" size="small" /></Box>)}
      </Stack></Paper>
    </Box>

    <Paper className="dashboard-panel recent-panel" elevation={0}><Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}><Box><Typography variant="h6">Nedavno ažurirani resursi</Typography><Typography variant="body2" color="text.secondary">Poslednjih pet promenjenih stavki</Typography></Box><Button endIcon={<ArrowForwardRounded />} onClick={() => navigate('/resources')}>Prikaži sve</Button></Stack>
      {stats.recentResources.length ? <Table><TableHead><TableRow><TableCell>Naziv</TableCell><TableCell>Kategorija</TableCell><TableCell>Lokacija</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>{stats.recentResources.map((resource) => <TableRow key={resource.id}><TableCell><Typography sx={{ fontWeight: 600 }}>{resource.name}</Typography><Typography variant="caption" color="text.secondary">{resource.code}</Typography></TableCell><TableCell>{resource.category.name}</TableCell><TableCell>{resource.location || '—'}</TableCell><TableCell><Chip size="small" color={statusColors[resource.status]} label={statusLabels[resource.status]} /></TableCell></TableRow>)}</TableBody></Table> : <Box className="compact-empty"><Inventory2Rounded /><Typography>Nema evidentiranih resursa.</Typography><Button onClick={() => navigate('/resources')}>Dodaj prvi resurs</Button></Box>}
    </Paper>
  </Container>
}
