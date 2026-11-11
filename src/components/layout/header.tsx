'use client';
import {
  AppBar,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ListIcon, SidebarSimpleIcon } from '@phosphor-icons/react';
import { useUiStore } from '@/stores/ui-store';
import { AccountMenu } from './account-menu';
import type { User } from '@/types/user';
export function Header({
  user,

  admin,
}: {
  user: User;

  admin: boolean;
}) {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('lg'));
  const open = useUiStore((state) => state.openSidebar);
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggle = useUiStore((state) => state.toggleSidebarCollapsed);
  const label = desktop ? (collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar') : 'Mở điều hướng';
  return (
    <AppBar
      component="header"
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: { xs: 80, sm: 80 },
          px: { xs: 2, md: 4 },
          gap: 2,
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" sx={{ gap: 2, alignItems: 'center' }}>
          <Tooltip title={label}>
            <IconButton
              onClick={desktop ? toggle : open}
              aria-label={label}
              aria-expanded={desktop ? !collapsed : sidebarOpen}
              aria-controls={desktop ? 'desktop-sidebar-navigation' : 'mobile-sidebar-navigation'}
            >
              {desktop ? (
                <SidebarSimpleIcon size={24} aria-hidden="true" />
              ) : (
                <ListIcon size={24} aria-hidden="true" />
              )}
            </IconButton>
          </Tooltip>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            {admin ? 'Quản trị Wandora' : 'Wandora'}
          </Typography>
        </Stack>
        <Stack direction="row" sx={{ gap: 2, alignItems: 'center' }}>
          <AccountMenu user={user} variant="profile" />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
