'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Alert, Button, Stack, Tooltip } from '@mui/material';
import { SignOutIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  return (
    <Stack spacing={1}>
      <Tooltip title={compact ? 'Đăng xuất' : ''} placement="right">
        <Button
          variant="outlined"
          aria-label="Đăng xuất"
          fullWidth
          sx={{ minWidth: 0, minHeight: 48, px: compact ? 0 : 2 }}
          startIcon={compact ? undefined : <SignOutIcon size={20} aria-hidden="true" />}
          disabled={pending}
          onClick={async () => {
            setPending(true);
            setError('');
            try {
              await api('/api/auth/logout', { method: 'POST' });
              toast.success('Đã đăng xuất.');
              router.replace('/login');
              router.refresh();
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Không thể đăng xuất.');
            } finally {
              setPending(false);
            }
          }}
        >
          {compact ? (
            <SignOutIcon size={20} aria-hidden="true" />
          ) : pending ? (
            'Đang đăng xuất…'
          ) : (
            'Đăng xuất'
          )}
        </Button>
      </Tooltip>
      {error && (
        <Alert severity="error" role="alert">
          {error}
        </Alert>
      )}
    </Stack>
  );
}
