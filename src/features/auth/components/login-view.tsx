'use client';
import { Box, Stack, Typography } from '@mui/material';
import { CompassIcon } from '@phosphor-icons/react';
import { LoginForm } from './login-form';
export function LoginView() {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      sx={{ gap: { xs: 4, md: 10 }, alignItems: 'center', minHeight: '64vh' }}
    >
      <Box
        sx={{
          flex: 1,
          width: '100%',
          bgcolor: 'background.default',
          p: { xs: 3, md: 4 },
          borderRadius: 3,
        }}
      >
        <Box
          sx={{ display: { xs: 'none', md: 'block' }, mb: 4, color: 'primary.main' }}
          aria-hidden="true"
        >
          <CompassIcon size={128} weight="duotone" />
        </Box>
        <Typography
          component="h1"
          variant="h1"
          sx={{ fontSize: { xs: '1.875rem', md: '3rem' }, lineHeight: { xs: '2.25rem', md: 1 } }}
        >
          Mỗi hành trình,
          <br />
          một khám phá mới.
        </Typography>
        <Typography sx={{ mt: 3 }} color="text.secondary">
          Không gian quản lý địa điểm, dịch vụ và những trải nghiệm du lịch của bạn.
        </Typography>
      </Box>
      <Box sx={{ flex: 1, width: '100%', maxWidth: 480 }}>
        <Typography component="h2" variant="h3">
          Chào mừng đến Wandora
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 2, mb: 4 }}>
          Đăng nhập để tiếp tục hành trình.
        </Typography>
        <LoginForm />
      </Box>
    </Stack>
  );
}
