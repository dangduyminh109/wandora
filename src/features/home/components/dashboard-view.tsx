'use client';
import Link from 'next/link';
import { Button, Stack, Typography } from '@mui/material';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import type { User } from '@/types/user';
export function DashboardView({ user }: { user: User }) {
  return (
    <>
      <PageHeader
        title={'Xin chào, ' + user.name}
        description="Chào mừng trở lại không gian của bạn."
      />
      <Stack spacing={3}>
        <Card
          title="Tài khoản của bạn"
          action={
            <Badge label={user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'} color="primary" />
          }
        >
          <Typography color="text.secondary">{user.email}</Typography>
          <Button component={Link} href="/profile" variant="outlined" sx={{ mt: 3, mr: 2 }}>
            Xem hồ sơ
          </Button>
          {user.role === 'admin' && (
            <Button component={Link} href="/admin" variant="contained" sx={{ mt: 3 }}>
              Mở trang quản trị
            </Button>
          )}
        </Card>
        <Card title="Những hành trình sắp tới">
          <Typography color="text.secondary">
            Các tính năng địa điểm, dịch vụ và đề xuất du lịch đang được phát triển.
          </Typography>
        </Card>
      </Stack>
    </>
  );
}
