import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: { main: '#003B7A' },
    secondary: { main: '#0070C0' },
    success: { main: '#00A651' },
    background: { default: '#F5F7FA', paper: '#FFFFFF' },
    text: { primary: '#102A43', secondary: '#52667A' },
  },
  typography: {
    fontFamily: 'Barlow, sans-serif',
    h1: { fontSize: '1.6rem', fontWeight: 700 },
    h2: { fontSize: '1.25rem', fontWeight: 700 },
    h3: { fontSize: '1rem', fontWeight: 700 },
    button: { fontWeight: 700, textTransform: 'none', letterSpacing: 0 },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiButton: { styleOverrides: { root: { minHeight: 44 } } },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiCard: { styleOverrides: { root: { border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0, 59, 122, 0.06)' } } },
  },
})