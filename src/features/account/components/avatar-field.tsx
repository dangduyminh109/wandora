'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Avatar, Button, Stack, Typography } from '@mui/material';
import { refreshSession } from '@/lib/api-client';
import { IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from '@/features/places/image-policy';
import type { User } from '@/types/user';

export function AvatarField({ user }: { user: User }) {
  const router = useRouter();
  const [avatar, setAvatar] = useState(user.avatar);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function change(file?: File) {
    setError('');
    if (
      file &&
      (!(IMAGE_MIME_TYPES as readonly string[]).includes(file.type) || file.size > MAX_IMAGE_BYTES)
    ) {
      setError('Chọn ảnh JPG, PNG hoặc WebP tối đa 5 MB.');
      return;
    }
    setBusy(true);
    try {
      const body = file ? new FormData() : undefined;
      if (file) body!.append('file', file);
      const send = () => fetch('/api/account/avatar', { method: file ? 'POST' : 'DELETE', body });
      let response = await send();
      if (response.status === 401 && (await refreshSession()).ok) response = await send();
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Không thể cập nhật ảnh đại diện.');
      setAvatar(data.user.avatar);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật ảnh đại diện.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack spacing={2} aria-busy={busy}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }} useFlexGap>
        <Avatar src={avatar || undefined} alt={user.name} sx={{ width: 80, height: 80 }}>
          {user.name.charAt(0).toUpperCase()}
        </Avatar>
        <Button component="label" variant="outlined" disabled={busy}>
          {busy ? 'Đang cập nhật…' : 'Đổi ảnh đại diện'}
          <input
            hidden
            type="file"
            accept={IMAGE_MIME_TYPES.join(',')}
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void change(file);
            }}
          />
        </Button>
        {avatar && (
          <Button disabled={busy} onClick={() => void change()}>
            Xóa ảnh
          </Button>
        )}
      </Stack>
      <Typography variant="body2" color="text.secondary">
        JPG, PNG hoặc WebP, tối đa 5 MB. Ảnh được lưu ngay khi chọn.
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
}
