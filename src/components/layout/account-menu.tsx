'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  Divider,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { CaretDownIcon, ShieldCheckIcon } from '@phosphor-icons/react';
import { LogoutButton } from '@/features/auth/components/logout-button';

export function AccountMenu({
  user,
  light = false,
  variant = 'button',
  onLoggedOut,
}: {
  user: { name: string; role: string; avatar?: string };
  light?: boolean;
  variant?: 'button' | 'profile';
  onLoggedOut?: () => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);
  const links = [
    { href: '/explore', label: 'Khám phá' },
    { href: '/dashboard', label: 'Không gian cá nhân' },
    { href: '/favorites', label: 'Yêu thích' },
    { href: '/activity', label: 'Đã xem gần đây' },
    { href: '/profile', label: 'Tài khoản' },
  ];
  return (
    <>
      {variant === 'profile' ? (
        <ButtonBase
          aria-label={`Mở menu tài khoản ${user.name}`}
          aria-controls={anchor ? 'account-menu' : undefined}
          aria-haspopup="menu"
          aria-expanded={Boolean(anchor)}
          onClick={(event) => setAnchor(event.currentTarget)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 0.5,
            pr: { xs: 0.5, md: 1.5 },
            borderRadius: 2,
            transition: 'background-color 0.2s',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Avatar
            src={user.avatar || undefined}
            alt={user.name}
            sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '.875rem' }}
          >
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Avatar>
          <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'left' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
            </Typography>
          </Box>
          <CaretDownIcon size={14} style={{ opacity: 0.7 }} />
        </ButtonBase>
      ) : (
        <Button
          aria-label={`Mở menu tài khoản ${user.name}`}
          aria-controls={anchor ? 'account-menu' : undefined}
          aria-haspopup="menu"
          aria-expanded={Boolean(anchor)}
          onClick={(event) => setAnchor(event.currentTarget)}
          variant="outlined"
          startIcon={
            <Avatar
              src={user.avatar || undefined}
              alt={user.name}
              sx={{ width: 24, height: 24, fontSize: 12 }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
          }
          sx={light ? { color: '#fff', borderColor: 'rgba(255,255,255,0.6)' } : undefined}
        >
          Tài khoản
        </Button>
      )}
      <Menu
        id="account-menu"
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 200,
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              p: 0.5,
            },
          },
        }}
      >
        {links.map((item) => (
          <MenuItem
            key={item.href}
            component={Link}
            href={item.href}
            onClick={close}
            sx={{ borderRadius: 1.5, py: 1, fontSize: '.875rem' }}
          >
            {item.label}
          </MenuItem>
        ))}
        {user.role === 'admin' && (
          <>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              component={Link}
              href="/admin"
              onClick={close}
              sx={{
                borderRadius: 1.5,
                py: 1,
                fontSize: '.875rem',
                fontWeight: 600,
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <ShieldCheckIcon size={18} />
              Trang quản trị
            </MenuItem>
          </>
        )}
        <Divider sx={{ my: 0.5 }} />
        <li style={{ listStyle: 'none', padding: '4px 8px' }}>
          <LogoutButton
            onLoggedOut={() => {
              close();
              onLoggedOut?.();
            }}
          />
        </li>
      </Menu>
    </>
  );
}
