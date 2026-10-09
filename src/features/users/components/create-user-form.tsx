'use client';
import { useRouter } from 'next/navigation';
import { Alert, MenuItem, Stack } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { User } from '@/types/user';
import { FormTextField } from '@/components/forms/form-text-field';
import { SubmitButton } from '@/components/forms/submit-button';
import { createUserSchema } from '../schemas';
import { FormPasswordField } from '@/components/forms/form-password-field';
export function CreateUserForm() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof createUserSchema>, unknown, z.output<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', password: '', role: 'user' },
  });
  return (
    <Stack
      component="form"
      noValidate
      spacing={3}
      aria-busy={isSubmitting}
      onSubmit={handleSubmit(async (data) => {
        try {
          const result = await api<{ user: User }>('/api/users', {
            method: 'POST',
            body: JSON.stringify(data),
          });
          toast.success('Đã tạo tài khoản ' + result.user.email + '.');
          router.push('/admin/users');
          router.refresh();
        } catch (error) {
          setError('root', {
            message: error instanceof Error ? error.message : 'Không thể tạo tài khoản.',
          });
        }
      })}
    >
      <FormTextField
        control={control}
        name="name"
        label="Họ tên"
        autoComplete="name"
        required
        slotProps={{ htmlInput: { maxLength: 100 } }}
      />
      <FormTextField
        control={control}
        name="email"
        label="Email"
        type="email"
        autoComplete="off"
        required
        slotProps={{ htmlInput: { maxLength: 254 } }}
      />
      <FormPasswordField
        control={control}
        name="password"
        label="Mật khẩu ban đầu"
        autoComplete="new-password"
        required
        helperText="Sử dụng ít nhất 12 ký tự."
      />
      <FormTextField control={control} name="role" label="Quyền truy cập" select>
        <MenuItem value="user">Người dùng</MenuItem>
        <MenuItem value="admin">Quản trị viên</MenuItem>
      </FormTextField>
      {errors.root && (
        <Alert severity="error" role="alert">
          {errors.root.message}
        </Alert>
      )}
      <SubmitButton pending={isSubmitting} pendingLabel="Đang tạo tài khoản…">
        Tạo tài khoản
      </SubmitButton>
    </Stack>
  );
}
