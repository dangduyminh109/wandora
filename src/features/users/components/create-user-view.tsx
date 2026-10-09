'use client';
import { Box } from '@mui/material';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { CreateUserForm } from './create-user-form';
export function CreateUserView() {
  return (
    <>
      <PageHeader
        title="Tạo tài khoản"
        description="Cấp quyền truy cập Wandora cho thành viên mới."
        breadcrumbs={[
          { label: 'Quản trị', href: '/admin' },
          { label: 'Người dùng', href: '/admin/users' },
          { label: 'Tạo tài khoản' },
        ]}
      />
      <Box sx={{ maxWidth: 640 }}>
        <Card>
          <CreateUserForm />
        </Card>
      </Box>
    </>
  );
}
