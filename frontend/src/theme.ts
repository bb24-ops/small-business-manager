import { createTheme } from '@mui/material/styles'
export const theme = createTheme({
  palette: { mode: 'light', primary: { main: '#325d88', dark: '#234564', light: '#e8f0f7' }, secondary: { main: '#d68c45' }, background: { default: '#f4f6f8', paper: '#ffffff' }, text: { primary: '#172534', secondary: '#607080' } },
  shape: { borderRadius: 12 },
  typography: { fontFamily: 'Roboto, system-ui, sans-serif', h4: { fontWeight: 700, letterSpacing: '-0.02em' }, h6: { fontWeight: 700 }, button: { textTransform: 'none', fontWeight: 600 } },
  components: { MuiButton: { defaultProps: { disableElevation: true } }, MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } } },
})
