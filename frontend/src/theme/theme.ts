import { alpha, createTheme } from '@mui/material/styles';

// Brand: deep ocean blue with a warm sunset accent.
const primary = '#0b4f8a';
const secondary = '#f28c28';

export const theme = createTheme({
  palette: {
    primary: { main: primary, dark: '#073864', light: '#3a78b3', contrastText: '#ffffff' },
    secondary: { main: secondary, dark: '#c96d14', light: '#f6ad63', contrastText: '#1d1d1d' },
    background: { default: '#f5f7fa', paper: '#ffffff' },
    text: { primary: '#14212e', secondary: '#526170' },
    success: { main: '#1e8e5a' },
    divider: '#e3e8ee',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: { fontWeight: 800, fontSize: '2.4rem', lineHeight: 1.15, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, fontSize: '1.9rem', lineHeight: 1.2, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700, fontSize: '1.5rem' },
    h4: { fontWeight: 700, fontSize: '1.25rem' },
    h5: { fontWeight: 600, fontSize: '1.1rem' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    button: { fontWeight: 600, textTransform: 'none' },
    overline: { fontWeight: 700, letterSpacing: '0.12em' },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 10, paddingInline: 20 }, sizeLarge: { paddingBlock: 12, fontSize: '1rem' } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: '1px solid #e3e8ee', boxShadow: '0 2px 10px rgba(16, 38, 64, 0.05)' } },
    },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 14 } } },
    MuiTextField: { defaultProps: { fullWidth: true } },
    MuiFormControl: { defaultProps: { fullWidth: true } },
    MuiAppBar: { styleOverrides: { root: { backgroundColor: '#ffffff', color: '#14212e', borderBottom: '1px solid #e3e8ee' } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiStepIcon: { styleOverrides: { root: { '&.Mui-completed': { color: '#1e8e5a' } } } },
    MuiAccordion: {
      defaultProps: { disableGutters: true, elevation: 0 },
      styleOverrides: { root: { border: '1px solid #e3e8ee', '&:before': { display: 'none' }, '&:not(:last-of-type)': { borderBottom: 0 } } },
    },
    MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: alpha('#14212e', 0.92), fontSize: '0.8rem' } } },
  },
});
