import { ArrowBackRounded, SearchOffRounded } from '@mui/icons-material'
import { Box, Button, Paper, Typography } from '@mui/material'
import { useNavigate } from 'react-router'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return <Box className="not-found-page"><Paper elevation={0} className="not-found-card"><SearchOffRounded /><Typography variant="h3">404</Typography><Typography variant="h5">Stranica nije pronađena</Typography><Typography color="text.secondary">Adresa koju ste otvorili ne postoji u aplikaciji.</Typography><Button variant="contained" startIcon={<ArrowBackRounded />} onClick={() => navigate('/dashboard')}>Nazad na kontrolnu tablu</Button></Paper></Box>
}
