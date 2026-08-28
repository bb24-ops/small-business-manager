import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'
import '@fontsource/roboto/latin-ext-400.css'
import '@fontsource/roboto/latin-ext-500.css'
import '@fontsource/roboto/latin-ext-700.css'
import './index.css'
import App from './App.tsx'
import { theme } from './theme'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: false } } })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter><QueryClientProvider client={queryClient}><ThemeProvider theme={theme}><CssBaseline /><App /></ThemeProvider></QueryClientProvider></BrowserRouter>
  </StrictMode>,
)
