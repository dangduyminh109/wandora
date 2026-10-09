'use client';
import { useRouter } from 'next/navigation';
import { Alert, Box, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { FormTextField } from '@/components/forms/form-text-field';
import { FormPasswordField } from '@/components/forms/form-password-field';
import { SubmitButton } from '@/components/forms/submit-button';
import { api } from '@/lib/api-client';
import type { User } from '@/types/user';
import { changePasswordSchema, profileSchema } from '../schemas';
function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof profileSchema>, unknown, z.output<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, phone: user.phone, bio: user.bio },
  });
  return (
    <Stack
      component="form"
      noValidate
      spacing={3}
      aria-busy={isSubmitting}
      onSubmit={handleSubmit(async (data) => {
        try {
          const result = await api<{ user: User }>('/api/account/profile', {
            method: 'PATCH',
            body: JSON.stringify(data),
          });
          reset({ name: result.user.name, phone: result.user.phone, bio: result.user.bio });
          toast.success('Đã cập nhật hồ sơ.');
          router.refresh();
        } catch (error) {
          setError('root', {
            message: error instanceof Error ? error.message : 'Không thể cập nhật hồ sơ.',
          });
        }
      })}
    >
      <TextField
        label="Email đăng nhập"
        value={user.email}
        fullWidth
        slotProps={{ input: { readOnly: true } }}
        helperText="Liên hệ quản trị viên nếu cần đổi email đăng nhập."
      />
      <FormTextField
        control={control}
        name="name"
        label="Họ tên"
        required
        autoComplete="name"
        slotProps={{ htmlInput: { maxLength: 100 } }}
      />
      <FormTextField
        control={control}
        name="phone"
        label="Số điện thoại"
        type="tel"
        autoComplete="tel"
        slotProps={{ htmlInput: { maxLength: 30 } }}
      />
      <FormTextField
        control={control}
        name="bio"
        label="Giới thiệu"
        multiline
        minRows={3}
        helperText="Tối đa 500 ký tự."
        slotProps={{ htmlInput: { maxLength: 500 } }}
      />
      {errors.root && <Alert severity="error">{errors.root.message}</Alert>}
      <SubmitButton pending={isSubmitting} pendingLabel="Đang lưu…">
        Lưu hồ sơ
      </SubmitButton>
    </Stack>
  );
}
function PasswordForm() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
  });
  return (
    <Stack
      component="form"
      noValidate
      spacing={3}
      aria-busy={isSubmitting}
      onSubmit={handleSubmit(async (data) => {
        try {
          await api('/api/account/password', { method: 'POST', body: JSON.stringify(data) });
          toast.success('Đã đổi mật khẩu. Vui lòng đăng nhập lại.');
          router.replace('/login');
          router.refresh();
        } catch (error) {
          setError('root', {
            message: error instanceof Error ? error.message : 'Không thể đổi mật khẩu.',
          });
        }
      })}
    >
      <Typography variant="body2" color="text.secondary">
        Sau khi đổi mật khẩu, bạn sẽ cần đăng nhập lại trên các thiết bị.
      </Typography>
      <FormPasswordField
        control={control}
        name="currentPassword"
        label="Mật khẩu hiện tại"
        required
        autoComplete="current-password"
      />
      <FormPasswordField
        control={control}
        name="password"
        label="Mật khẩu mới"
        required
        autoComplete="new-password"
        helperText="Sử dụng ít nhất 12 ký tự."
      />
      <FormPasswordField
        control={control}
        name="confirmPassword"
        label="Xác nhận mật khẩu mới"
        required
        autoComplete="new-password"
      />
      {errors.root && <Alert severity="error">{errors.root.message}</Alert>}
      <SubmitButton pending={isSubmitting} pendingLabel="Đang đổi mật khẩu…">
        Đổi mật khẩu
      </SubmitButton>
    </Stack>
  );
}
export function ProfileView({ user }: { user: User }) {
  return (
    <>
      <PageHeader
        title="Tài khoản của bạn"
        description="Cập nhật hồ sơ và bảo vệ tài khoản Wandora."
        breadcrumbs={[{ label: 'Không gian cá nhân', href: '/dashboard' }, { label: 'Tài khoản' }]}
      />
      <Stack direction="row" sx={{ mb: 3, gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Badge label={user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'} color="primary" />
        <Typography variant="body2" color="text.secondary">
          Tham gia từ{' '}
          {new Date(user.createdAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Bangkok' })}
        </Typography>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Card title="Hồ sơ cá nhân">
          <ProfileForm user={user} />
        </Card>
        <Card title="Đổi mật khẩu">
          <PasswordForm />
        </Card>
      </Box>
    </>
  );
}
