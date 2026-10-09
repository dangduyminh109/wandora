'use client';
import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Link as MuiLink, Stack, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { FormTextField } from '@/components/forms/form-text-field';
import { FormPasswordField } from '@/components/forms/form-password-field';
import { SubmitButton } from '@/components/forms/submit-button';
import { forgotPasswordSchema, resetPasswordSchema } from '../schemas';
function RecoveryShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', py: { xs: 3, md: 6 } }}>
      <Card>
        <Typography component="h1" variant="h3">
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 2, mb: 3 }}>
          {description}
        </Typography>
        {children}
        <MuiLink component={Link} href="/login" sx={{ display: 'inline-block', mt: 3 }}>
          Về trang đăng nhập
        </MuiLink>
      </Card>
    </Box>
  );
}
export function ForgotPasswordView() {
  const [message, setMessage] = useState('');
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof forgotPasswordSchema>, unknown, z.output<typeof forgotPasswordSchema>>(
    { resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } },
  );
  return (
    <RecoveryShell
      title="Quên mật khẩu?"
      description="Nhập email đăng nhập để nhận link đặt lại mật khẩu."
    >
      <Stack
        component="form"
        noValidate
        spacing={3}
        aria-busy={isSubmitting}
        onSubmit={handleSubmit(async (data) => {
          setMessage('');
          try {
            const result = await api<{ message: string }>('/api/auth/forgot-password', {
              method: 'POST',
              body: JSON.stringify(data),
            });
            setMessage(result.message);
            toast.success('Yêu cầu đã được tiếp nhận.');
          } catch (error) {
            setError('root', {
              message: error instanceof Error ? error.message : 'Không thể gửi yêu cầu.',
            });
          }
        })}
      >
        <FormTextField
          control={control}
          name="email"
          label="Email"
          type="email"
          autoComplete="username"
          required
          slotProps={{ htmlInput: { maxLength: 254 } }}
        />
        {message && (
          <Alert severity="success" role="status">
            {message}
          </Alert>
        )}
        {errors.root && <Alert severity="error">{errors.root.message}</Alert>}
        <SubmitButton pending={isSubmitting} pendingLabel="Đang gửi…">
          Gửi link đặt lại mật khẩu
        </SubmitButton>
      </Stack>
    </RecoveryShell>
  );
}
const subscribe = (callback: () => void) => {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
};
function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: '', confirmPassword: '' },
  });
  return (
    <Stack
      component="form"
      noValidate
      spacing={3}
      aria-busy={isSubmitting}
      onSubmit={handleSubmit(async (data) => {
        try {
          await api('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(data) });
          toast.success('Đã đặt lại mật khẩu. Vui lòng đăng nhập.');
          router.replace('/login');
          router.refresh();
        } catch (error) {
          setError('root', {
            message: error instanceof Error ? error.message : 'Không thể đặt lại mật khẩu.',
          });
        }
      })}
    >
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
      <SubmitButton pending={isSubmitting} pendingLabel="Đang đặt lại…">
        Đặt lại mật khẩu
      </SubmitButton>
    </Stack>
  );
}
export function ResetPasswordView() {
  const token = useSyncExternalStore(
    subscribe,
    () => new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '',
    () => '',
  );
  return (
    <RecoveryShell title="Đặt lại mật khẩu" description="Chọn mật khẩu mới cho tài khoản Wandora.">
      {/^[a-f0-9]{64}$/.test(token) ? (
        <ResetForm key={token} token={token} />
      ) : (
        <Alert severity="warning">
          Link không hợp lệ.{' '}
          <MuiLink component={Link} href="/forgot-password">
            Yêu cầu link mới
          </MuiLink>
        </Alert>
      )}
    </RecoveryShell>
  );
}
