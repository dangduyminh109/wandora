'use client';
import { createTheme } from '@mui/material/styles';
export const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: { main: '#075985', dark: '#0c4a6e', contrastText: '#fff' },
    secondary: { main: '#163047' },
    background: { default: '#f1f7fa', paper: '#fff' },
    text: { primary: '#163047', secondary: '#516579' },
    divider: '#bdccd5',
    warning: { main: '#9a6700' },
    error: { main: '#b42318' },
    success: { main: '#166534' },
  },
  typography: {
    fontFamily: 'Geist, sans-serif',
    h1: { fontSize: '3rem', lineHeight: 1, fontWeight: 600 },
    h2: { fontSize: '2.25rem', lineHeight: '2.5rem', fontWeight: 600 },
    h3: { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 600 },
    h4: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 600 },
    body1: { fontSize: '1rem', lineHeight: '1.5rem' },
    body2: { fontSize: '.875rem', lineHeight: '1.25rem' },
    button: { fontSize: '1rem', fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 8 },
  transitions: {
    easing: {
      easeInOut: 'cubic-bezier(.32,.72,0,1)',
      easeOut: 'cubic-bezier(.32,.72,0,1)',
      easeIn: 'cubic-bezier(.32,.72,0,1)',
      sharp: 'cubic-bezier(.32,.72,0,1)',
    },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 44, padding: '8px 12px' } },
    },
    MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiCard: { styleOverrides: { root: { borderRadius: 16 } } },
    MuiTextField: { defaultProps: { fullWidth: true, variant: 'outlined' } },
    MuiTableCell: {
      styleOverrides: {
        head: { backgroundColor: '#f1f7fa', color: '#516579', fontWeight: 600 },
        root: { padding: '16px 24px' },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 500 } } },
    MuiCssBaseline: {
      styleOverrides: {
        body: { margin: 0 },
        'h1,h2,h3,h4': { textWrap: 'balance' },
        p: { textWrap: 'pretty' },
        ':focus-visible': { outline: '3px solid #075985', outlineOffset: 4 },
        '@media (prefers-reduced-motion: reduce)': {
          '*,*::before,*::after': {
            animationDuration: '0ms !important',
            transitionDuration: '0ms !important',
          },
        },
      },
    },
  },
});
