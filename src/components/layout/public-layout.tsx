'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { Brand } from './brand';
export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box component="header" sx={{ py: 3 }}>
        <Container maxWidth="lg">
          <Stack
            direction="row"
            sx={{ gap: 2, alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Brand />
            <Box component="nav" aria-label="Điều hướng chính">
              <Button
                component={Link}
                href={pathname === '/login' ? '/' : '/login'}
                variant={pathname === '/login' ? 'text' : 'contained'}
              >
                {pathname === '/login' ? 'Trang chủ' : 'Đăng nhập'}
              </Button>
            </Box>
          </Stack>
        </Container>
      </Box>
      <Container component="main" id="main" maxWidth="lg" sx={{ py: { xs: 3, md: 6 }, flex: 1 }}>
        {children}
      </Container>
      <Container component="footer" maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Wandora · Không gian dành cho những hành trình mới
        </Typography>
      </Container>
    </Box>
  );
}
