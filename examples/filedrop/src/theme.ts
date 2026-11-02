import { createTheme } from '@mui/material/styles'

/** 深灰底 + 琥珀（我的）/ 青绿（对方）——避开紫系与奶油风 */
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#e8a838', light: '#f0c46a', dark: '#c48420' },
    secondary: { main: '#3db8a8', light: '#6fd0c4', dark: '#2a8f82' },
    background: {
      default: '#12151a',
      paper: '#1b2028',
    },
    text: {
      primary: '#f2efe8',
      secondary: '#9aa3b2',
    },
    divider: 'rgba(255,255,255,0.08)',
    success: { main: '#4caf7a' },
    warning: { main: '#e8a838' },
    error: { main: '#e57373' },
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 650, letterSpacing: '-0.01em' },
    button: { textTransform: 'none', fontWeight: 600 },
    overline: {
      fontFamily: '"IBM Plex Mono", monospace',
      letterSpacing: '0.14em',
    },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            'radial-gradient(1200px 600px at 10% -10%, rgba(232,168,56,0.12), transparent 55%), radial-gradient(900px 500px at 100% 0%, rgba(61,184,168,0.10), transparent 50%), linear-gradient(180deg, #12151a 0%, #0e1116 100%)',
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, paddingInline: 18 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
})
