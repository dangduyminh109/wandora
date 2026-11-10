'use client';
import { Box, Stack, Typography } from '@mui/material';
import { MapPinIcon, BedIcon, ForkKnifeIcon, ShieldCheckIcon } from '@phosphor-icons/react';
import { LoginForm } from './login-form';

const highlights = [
  { icon: MapPinIcon, text: 'Quản lý địa điểm du lịch' },
  { icon: BedIcon, text: 'Khách sạn & lưu trú' },
  { icon: ForkKnifeIcon, text: 'Nhà hàng & ẩm thực' },
  { icon: ShieldCheckIcon, text: 'Bảo mật JWT + refresh token' },
];

function GridPattern() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0.07,
        pointerEvents: 'none',
      }}
    >
      <defs>
        <pattern id="login-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#login-grid)" />
    </svg>
  );
}

export function LoginView({ redirectTo }: { redirectTo?: string }) {
  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100dvh - 64px)' }}>
      {/* ── LEFT PANEL: visual/brand ── */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          position: 'relative',
          flexDirection: 'column',
          justifyContent: 'center',
          px: 8,
          background: 'linear-gradient(140deg, #0c1e2e 0%, #075985 100%)',
          overflow: 'hidden',
        }}
      >
        <GridPattern />
        {/* Orb */}
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            bottom: '-10%',
            right: '-10%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14,165,233,0.25) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {/* Logo mark */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 2.5,
              bgcolor: 'rgba(255,255,255,0.12)',
              mb: 4,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/wandora-mark.svg" width={32} height={32} alt="" />
          </Box>

          <Typography
            component="h1"
            sx={{
              fontSize: { md: '2.25rem', lg: '2.75rem' },
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              textWrap: 'balance',
            }}
          >
            Quản lý hành trình,
            <br />
            kết nối mọi điểm đến.
          </Typography>

          <Typography
            sx={{ mt: 3, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, maxWidth: 360 }}
          >
            Nền tảng tập trung địa điểm, lưu trú và ẩm thực vào một không gian quản trị thống nhất.
          </Typography>

          {/* Highlights */}
          <Stack sx={{ mt: 5, gap: 2.5 }}>
            {highlights.map(({ icon: Icon, text }) => (
              <Stack key={text} direction="row" sx={{ gap: 2, alignItems: 'center' }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    p: 1,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(14,165,233,0.18)',
                    color: '#38bdf8',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} weight="duotone" aria-hidden="true" />
                </Box>
                <Typography
                  sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '.9375rem', fontWeight: 500 }}
                >
                  {text}
                </Typography>
              </Stack>
            ))}
          </Stack>

          {/* Bottom badge */}
          <Box
            sx={{
              mt: 8,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1,
              borderRadius: 99,
              border: '1px solid rgba(255,255,255,0.12)',
              bgcolor: 'rgba(255,255,255,0.06)',
            }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4ade80' }} />
            <Typography
              sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '.8125rem', fontWeight: 500 }}
            >
              Nhóm 404 · Đồ án NoSQL
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── RIGHT PANEL: form ── */}
      <Box
        sx={{
          flex: { xs: 1, md: 'none' },
          width: { md: 480 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: { xs: 3, sm: 6 },
          py: 6,
          bgcolor: '#fff',
        }}
      >
        <Box sx={{ maxWidth: 360, mx: 'auto', width: '100%' }}>
          {/* Mobile brand */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 4 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/wandora-mark.svg" width={36} height={36} alt="Wandora" />
          </Box>

          <Typography
            component="h2"
            sx={{
              fontSize: { xs: '1.5rem', md: '1.875rem' },
              fontWeight: 800,
              color: '#163047',
              letterSpacing: '-0.01em',
            }}
          >
            Chào mừng trở lại
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5, mb: 5, lineHeight: 1.6 }}>
            Đăng nhập để tiếp tục hành trình của bạn.
          </Typography>

          <LoginForm redirectTo={redirectTo} />

          <Typography variant="body2" color="text.secondary" sx={{ mt: 5, textAlign: 'center' }}>
            Chưa có tài khoản? Liên hệ quản trị viên để được cấp quyền truy cập.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
