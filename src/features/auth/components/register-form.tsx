'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, Link as MuiLink, Stack, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { api } from '@/lib/api-client';
import { FormTextField } from '@/components/forms/form-text-field';
import { FormPasswordField } from '@/components/forms/form-password-field';
import { SubmitButton } from '@/components/forms/submit-button';
import { registerSchema } from '../schemas';

export function RegisterForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const loginHref = redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login';
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof registerSchema>, unknown, z.output<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });
  const submit = handleSubmit(async (data) => {
    try {
      await api('/api/auth/register', { method: 'POST', body: JSON.stringify(data) });
      router.replace(`${loginHref}${redirectTo ? '&' : '?'}registered=1`);
    } catch (error) {
      setError('root', { message: error instanceof Error ? error.message : 'Không thể đăng ký.' });
    }
  });
  return (
    <Stack component="form" noValidate onSubmit={submit} spacing={3} aria-busy={isSubmitting}>
      <FormTextField
        control={control}
        name="name"
        label="Họ và tên"
        autoComplete="name"
        required
        slotProps={{ htmlInput: { maxLength: 100 } }}
      />
      <FormTextField
        control={control}
        name="email"
        label="Email"
        type="email"
        autoComplete="username"
        required
        slotProps={{ htmlInput: { maxLength: 254 } }}
      />
      <FormPasswordField
        control={control}
        name="password"
        label="Mật khẩu"
        autoComplete="new-password"
        helperText="Ít nhất 12 ký tự."
        required
      />
      <FormPasswordField
        control={control}
        name="confirmPassword"
        label="Xác nhận mật khẩu"
        autoComplete="new-password"
        required
      />
      {errors.root && (
        <Alert severity="error" role="alert">
          {errors.root.message}
        </Alert>
      )}
      <SubmitButton pending={isSubmitting} pendingLabel="Đang tạo tài khoản…">
        Tạo tài khoản
      </SubmitButton>
      <Typography variant="body2" color="text.secondary">
        Đã có tài khoản?{' '}
        <MuiLink component={Link} href={loginHref}>
          Đăng nhập
        </MuiLink>
      </Typography>
    </Stack>
  );
}
