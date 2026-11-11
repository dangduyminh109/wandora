'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  HouseIcon,
  UsersIcon,
  CompassIcon,
  XIcon,
  UserCircleIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  BedIcon,
  ForkKnifeIcon,
  TicketIcon,
  ClockCounterClockwiseIcon,
  HeartIcon,
} from '@phosphor-icons/react';
import { useUiStore } from '@/stores/ui-store';
import { Brand } from './brand';

export const SIDEBAR_WIDTH = 256;
export const SIDEBAR_COLLAPSED_WIDTH = 80;

export function Sidebar({
  admin = false,
  footer,
  compactFooter,
}: {
  admin?: boolean; // đang ở khu quản trị (/admin/*)
  isAdmin?: boolean; // tài khoản có vai trò admin (để hiện lối sang khu quản trị)
  footer?: React.ReactNode;
  compactFooter?: React.ReactNode;
}) {
  const pathname = usePathname();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('lg'));
  const open = useUiStore((state) => state.sidebarOpen);
  const close = useUiStore((state) => state.closeSidebar);
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const width = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const links = admin
    ? [
        { href: '/admin', label: 'Tổng quan', icon: HouseIcon },
        { href: '/admin/places', label: 'Địa điểm', icon: MapPinIcon },
        { href: '/admin/hotels', label: 'Khách sạn', icon: BedIcon },
        { href: '/admin/restaurants', label: 'Nhà hàng', icon: ForkKnifeIcon },
        { href: '/admin/services', label: 'Dịch vụ', icon: TicketIcon },
        { href: '/admin/users', label: 'Người dùng', icon: UsersIcon },
        { href: '/explore', label: 'Về khám phá', icon: MagnifyingGlassIcon },
        { href: '/dashboard', label: 'Không gian cá nhân', icon: CompassIcon },
      ]
    : [
        { href: '/dashboard', label: 'Tổng quan', icon: CompassIcon },
        { href: '/explore', label: 'Khám phá', icon: MagnifyingGlassIcon },
        { href: '/favorites', label: 'Yêu thích', icon: HeartIcon },
        { href: '/activity', label: 'Đã xem gần đây', icon: ClockCounterClockwiseIcon },
        { href: '/profile', label: 'Tài khoản', icon: UserCircleIcon },
      ];

  function content(mini: boolean, mobile: boolean) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          p: mini ? 2 : 3,
          overflowX: 'hidden',
        }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: mini ? 'center' : 'space-between',
            mb: mini ? 4 : 0,
          }}
        >
          <Brand href={admin ? '/admin' : '/dashboard'} compact={mini} />
          {mobile && (
            <IconButton onClick={close} aria-label="Đóng điều hướng">
              <XIcon size={20} aria-hidden="true" />
            </IconButton>
          )}
        </Stack>
        {!mini && (
          <Typography color="text.secondary" variant="body2" sx={{ mt: 2, mb: 3 }}>
            {admin ? 'Không gian quản trị' : 'Không gian của bạn'}
          </Typography>
        )}
        <Box
          component="nav"
          id={mobile ? 'mobile-sidebar-navigation' : 'desktop-sidebar-navigation'}
          aria-label={admin ? 'Điều hướng quản trị' : 'Điều hướng cá nhân'}
        >
          <List disablePadding>
            {links.map((item) => {
              const selected =
                item.href === '/admin'
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Tooltip key={item.href} title={mini ? item.label : ''} placement="right" arrow>
                  <ListItemButton
                    component={Link}
                    href={item.href}
                    selected={selected}
                    aria-label={item.label}
                    aria-current={selected ? 'page' : undefined}
                    onClick={mobile ? close : undefined}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      minHeight: 48,
                      px: mini ? 0 : 2,
                      justifyContent: mini ? 'center' : 'flex-start',
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': { bgcolor: 'primary.dark' },
                        '& .MuiListItemIcon-root': { color: 'inherit' },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: mini ? 0 : 32, justifyContent: 'center' }}>
                      <item.icon size={20} aria-hidden="true" />
                    </ListItemIcon>
                    {!mini && <ListItemText primary={item.label} />}
                  </ListItemButton>
                </Tooltip>
              );
            })}
          </List>
        </Box>
        <Box sx={{ mt: 'auto', pt: 4 }}>
          <Divider sx={{ mb: 2 }} />
          {mini ? compactFooter : footer}
          {!mini && (
            <Typography variant="body2" color="text.secondary">
              Khám phá những hành trình mới cùng Wandora.
            </Typography>
          )}
        </Box>
      </Box>
    );
  }
  const transition = theme.transitions.create('width', {
    duration: theme.transitions.duration.shorter,
  });
  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', lg: 'block' },
          width,
          flexShrink: 0,
          transition,
          '& .MuiDrawer-paper': {
            width,
            transition,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            overflowX: 'hidden',
          },
        }}
      >
        {content(collapsed, false)}
      </Drawer>
      <Drawer
        variant="temporary"
        open={open && !desktop}
        onClose={close}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH },
        }}
      >
        {content(false, true)}
      </Drawer>
    </>
  );
}
