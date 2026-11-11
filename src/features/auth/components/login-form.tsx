'use client';
import { useRouter } from 'next/navigation';
import { Alert, Stack, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { FormTextField } from '@/components/forms/form-text-field';
import { SubmitButton } from '@/components/forms/submit-button';
import type { User } from '@/types/user';
import { loginSchema } from '../schemas';
import { postLoginTarget } from '../routes';
import Link from 'next/link';
import { Link as MuiLink } from '@mui/material';
import { FormPasswordField } from '@/components/forms/form-password-field';
export function LoginForm({
  redirectTo,
  registered = false,
}: {
  redirectTo?: string;
  registered?: boolean;
}) {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof loginSchema>, unknown, z.output<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const submit = handleSubmit(async (data) => {
    try {
      const { user } = await api<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast.success('Đăng nhập thành công.');
      router.push(postLoginTarget(user, redirectTo));
      router.refresh();
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : 'Không thể đăng nhập.',
      });
    }
  });
  return (
    <Stack component="form" noValidate onSubmit={submit} spacing={3} aria-busy={isSubmitting}>
      {registered && (
        <Alert severity="success" role="status">
          Đăng ký thành công. Hãy đăng nhập bằng tài khoản vừa tạo.
        </Alert>
      )}
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
        autoComplete="current-password"
        required
      />
      <MuiLink component={Link} href="/forgot-password" sx={{ alignSelf: 'flex-end' }}>
        Quên mật khẩu?
      </MuiLink>
      {errors.root && (
        <Alert severity="error" role="alert">
          {errors.root.message}
        </Alert>
      )}
      <SubmitButton pending={isSubmitting} pendingLabel="Đang đăng nhập…">
        Đăng nhập
      </SubmitButton>
      <Typography variant="body2" color="text.secondary">
        Chưa có tài khoản?{' '}
        <MuiLink
          component={Link}
          href={redirectTo ? `/register?redirect=${encodeURIComponent(redirectTo)}` : '/register'}
        >
          Đăng ký ngay
        </MuiLink>
      </Typography>
    </Stack>
  );
}
