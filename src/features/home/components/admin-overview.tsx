'use client';
import Link from 'next/link';
import { Button, Stack, Typography } from '@mui/material';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
export function AdminOverview() {
  return (
    <>
      <PageHeader title="Tổng quan" description="Quản lý thành viên và không gian Wandora." />
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 3 }}>
        <Card title="Người dùng" sx={{ flex: 1 }}>
          <Typography color="text.secondary">
            Tìm kiếm tài khoản và cấp quyền truy cập cho thành viên mới.
          </Typography>
          <Button component={Link} href="/admin/users" variant="contained" sx={{ mt: 3 }}>
            Quản lý người dùng
          </Button>
        </Card>
        <Card title="Component mẫu" sx={{ flex: 1 }}>
          <Typography color="text.secondary">
            Xem các trạng thái và cách hoạt động của bộ component dùng chung.
          </Typography>
          <Button component={Link} href="/admin/components" variant="outlined" sx={{ mt: 3 }}>
            Mở trang mẫu
          </Button>
        </Card>
      </Stack>
    </>
  );
}
