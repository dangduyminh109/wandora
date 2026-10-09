'use client';
import Link from 'next/link';
import { Box, Button, Stack, Typography } from '@mui/material';
import { CompassIcon } from '@phosphor-icons/react';
export function PublicHome() {
  return (
    <Box sx={{ maxWidth: 880, mx: 'auto', py: { xs: 3, md: 8 } }}>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 6, alignItems: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <Typography
            component="h1"
            variant="h1"
            sx={{
              fontSize: { xs: '2.25rem', md: '3rem' },
              lineHeight: { xs: '2.5rem', md: 1 },
              maxWidth: 680,
            }}
          >
            Mỗi hành trình,
            <br />
            một khám phá mới.
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 3, maxWidth: 480 }}>
            Không gian quản lý địa điểm, dịch vụ và những trải nghiệm du lịch của bạn.
          </Typography>
          <Button component={Link} href="/login" variant="contained" sx={{ mt: 4 }}>
            Đăng nhập Wandora
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Tài khoản được quản trị viên cấp cho thành viên.
          </Typography>
        </Box>
        <Box
          aria-hidden="true"
          sx={{ bgcolor: 'background.default', borderRadius: 3, p: 6, color: 'primary.main' }}
        >
          <CompassIcon size={128} weight="duotone" />
        </Box>
      </Stack>
      <Box sx={{ mt: 10 }}>
        <Typography
          variant="h2"
          component="h2"
          sx={{ fontSize: { xs: '1.875rem', md: '2.25rem' } }}
        >
          Một nơi để bắt đầu.
          <br />
          Nhiều hành trình để khám phá.
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 3 }}>
          Wandora đang phát triển tính năng quản lý địa điểm và đề xuất du lịch. Thành viên có thể
          đăng nhập và sử dụng không gian cá nhân hiện tại.
        </Typography>
      </Box>
    </Box>
  );
}
