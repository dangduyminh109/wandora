'use client';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { Toaster } from 'sonner';
import { theme } from '@/lib/theme';
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
        <Toaster
          richColors
          closeButton
          position="top-center"
          toastOptions={{ style: { fontFamily: 'Geist, sans-serif' } }}
        />
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
