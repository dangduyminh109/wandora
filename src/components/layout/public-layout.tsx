'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Box, Button, Container, Divider, Stack, Typography } from '@mui/material';
import { Brand } from './brand';
import { SmoothScroll } from '../common/smooth-scroll';
import { api } from '@/lib/api-client';
import { homeForRole } from '@/features/auth/routes';

const HEADER_HEIGHT = 64; // px
const isHeroRoute = (pathname: string) => pathname === '/';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hero = isHeroRoute(pathname);
  const [heroScrolled, setHeroScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    if (!hero) return;
    const handler = () => setHeroScrolled(window.scrollY > 20);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [hero]);

  useEffect(() => {
    let active = true;
    api<{ user: { name: string; role: string } }>('/api/auth/me')
      .then((data) => {
        if (active) setCurrentUser(data.user);
      })
      .catch(() => {
        if (active) setCurrentUser(null);
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  // Trang không có hero luôn dùng header đặc; trang chủ đổi khi cuộn.
  const headerSolid = !hero || heroScrolled;

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <SmoothScroll />
      {/* ── HEADER (fixed so it overlays the hero) ── */}
      <Box
        component="header"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: HEADER_HEIGHT,
          transition: 'background-color 0.25s ease, box-shadow 0.25s ease',
          bgcolor: headerSolid ? 'rgba(255,255,255,0.95)' : 'transparent',
          backdropFilter: headerSolid ? 'blur(12px)' : 'none',
          boxShadow: headerSolid ? '0 1px 0 #bdccd5' : 'none',
        }}
      >
        <Container maxWidth="lg" sx={{ height: '100%' }}>
          <Stack
            direction="row"
            sx={{ gap: 2, alignItems: 'center', justifyContent: 'space-between', height: '100%' }}
          >
            {/* Brand adapts color: white on dark hero, primary on white header */}
            <Box
              sx={{
                color: headerSolid ? 'text.primary' : '#fff',
                '& a': { color: 'inherit !important' },
                transition: 'color 0.25s',
              }}
            >
              <Brand />
            </Box>

            {/* Desktop Navigation */}
            <Stack
              direction="row"
              component="nav"
              aria-label="Điều hướng chính"
              sx={{
                display: { xs: 'none', md: 'flex' },
                gap: 1,
                alignItems: 'center',
              }}
            >
              <Button
                component={Link}
                href="/explore"
                variant="text"
                size="small"
                sx={{
                  color: pathname.startsWith('/explore')
                    ? headerSolid
                      ? '#075985'
                      : '#38bdf8'
                    : headerSolid
                      ? '#334155'
                      : 'rgba(255,255,255,0.9)',
                  fontWeight: pathname.startsWith('/explore') ? 700 : 600,
                  fontSize: '.875rem',
                  px: 2,
                  py: 0.75,
                  borderRadius: 2,
                  bgcolor: pathname.startsWith('/explore')
                    ? headerSolid
                      ? 'rgba(7,89,133,0.1)'
                      : 'rgba(255,255,255,0.18)'
                    : 'transparent',
                  '&:hover': {
                    color: headerSolid ? '#075985' : '#fff',
                    bgcolor: headerSolid ? 'rgba(7,89,133,0.08)' : 'rgba(255,255,255,0.15)',
                  },
                }}
              >
                Khám phá
              </Button>

              {hero ? (
                [
                  { label: 'Tính năng', href: '#features' },
                  { label: 'Điểm đến', href: '#destinations' },
                  { label: 'Quy trình', href: '#how-it-works' },
                  { label: 'Công nghệ', href: '#tech-stack' },
                ].map((item) => (
                  <Button
                    key={item.href}
                    component="a"
                    href={item.href}
                    variant="text"
                    size="small"
                    sx={{
                      color: headerSolid ? '#334155' : 'rgba(255,255,255,0.9)',
                      fontWeight: 600,
                      fontSize: '.875rem',
                      px: 2,
                      py: 0.75,
                      borderRadius: 2,
                      '&:hover': {
                        color: headerSolid ? '#075985' : '#fff',
                        bgcolor: headerSolid ? 'rgba(7,89,133,0.08)' : 'rgba(255,255,255,0.15)',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                ))
              ) : (
                <Button
                  component={Link}
                  href="/"
                  variant="text"
                  size="small"
                  sx={{
                    color: headerSolid ? '#334155' : 'rgba(255,255,255,0.9)',
                    fontWeight: 600,
                    fontSize: '.875rem',
                    px: 2,
                    py: 0.75,
                    borderRadius: 2,
                    '&:hover': {
                      color: headerSolid ? '#075985' : '#fff',
                      bgcolor: headerSolid ? 'rgba(7,89,133,0.08)' : 'rgba(255,255,255,0.15)',
                    },
                  }}
                >
                  Trang chủ
                </Button>
              )}
            </Stack>

            <Box component="nav" aria-label="Tài khoản">
              {currentUser ? (
                <Button
                  component={Link}
                  href={homeForRole(currentUser.role as 'admin' | 'user')}
                  variant={headerSolid ? 'contained' : 'outlined'}
                  size="small"
                  sx={
                    !headerSolid
                      ? {
                          color: '#fff',
                          borderColor: 'rgba(255,255,255,0.6)',
                          '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.12)' },
                        }
                      : { px: 2.5 }
                  }
                >
                  {currentUser.role === 'admin' ? 'Trang quản trị' : 'Không gian của bạn'}
                </Button>
              ) : pathname !== '/login' ? (
                <Button
                  component={Link}
                  href="/login"
                  variant={headerSolid ? 'contained' : 'outlined'}
                  size="small"
                  sx={
                    !headerSolid
                      ? {
                          color: '#fff',
                          borderColor: 'rgba(255,255,255,0.6)',
                          '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.12)' },
                        }
                      : { px: 2.5 }
                  }
                >
                  Đăng nhập
                </Button>
              ) : (
                <Button component={Link} href="/" variant="text" size="small">
                  Trang chủ
                </Button>
              )}
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* ── CONTENT (push down by header height on non-hero pages) ── */}
      <Box
        component="main"
        id="main"
        sx={{
          flex: 1,
          // On hero page: children (PublicHome) handle their own top offset inside the hero section
          // On other pages (login, etc.): need padding-top so content isn't hidden under the fixed header
          pt: hero ? 0 : `${HEADER_HEIGHT}px`,
        }}
      >
        {children}
      </Box>

      {/* ── FOOTER ── */}
      <Box component="footer" sx={{ bgcolor: 'background.default' }}>
        <Divider />
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            sx={{ py: 4, gap: 3, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
          >
            <Box sx={{ color: 'text.primary' }}>
              <Brand />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Khám phá và quản lý những hành trình đáng nhớ.
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              © 2025 Wandora · Nhóm 404
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
