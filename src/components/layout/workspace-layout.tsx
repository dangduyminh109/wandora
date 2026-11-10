'use client';
import { Box, Container } from '@mui/material';
import type { User } from '@/types/user';
import { Header } from './header';
import { Sidebar } from './sidebar';
export function WorkspaceLayout({
  children,
  user,
  admin = false,
  sidebarFooter,
  compactSidebarFooter,
}: {
  children: React.ReactNode;
  user: User;
  admin?: boolean;
  sidebarFooter?: React.ReactNode;
  compactSidebarFooter?: React.ReactNode;
}) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      <Sidebar
        admin={admin}
        isAdmin={user.role === 'admin'}
        footer={sidebarFooter}
        compactFooter={compactSidebarFooter}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Header user={user} admin={admin} />
        <Container
          component="main"
          id="main"
          maxWidth="xl"
          sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 4 } }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
}
