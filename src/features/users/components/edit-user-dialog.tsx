'use client';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { toast } from 'sonner';
import { FormTextField } from '@/components/forms/form-text-field';
import { SubmitButton } from '@/components/forms/submit-button';
import { editUserSchema } from '@/features/account/schemas';
import { api } from '@/lib/api-client';
import type { User } from '@/types/user';
export function EditUserDialog({
  user,
  self,
  onClose,
  onSaved,
}: {
  user: User;
  self: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof editUserSchema>, unknown, z.output<typeof editUserSchema>>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { name: user.name, email: user.email, role: user.role, status: user.status },
  });
  return (
    <Dialog
      open
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="edit-user-title"
    >
      <Stack
        component="form"
        noValidate
        aria-busy={isSubmitting}
        onSubmit={handleSubmit(async (data) => {
          try {
            await api(`/api/users/${user.id}`, { method: 'PATCH', body: JSON.stringify(data) });
            toast.success('Đã cập nhật tài khoản.');
            onSaved();
          } catch (error) {
            setError('root', {
              message: error instanceof Error ? error.message : 'Không thể cập nhật tài khoản.',
            });
          }
        })}
      >
        <DialogTitle id="edit-user-title">Chỉnh sửa tài khoản</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <FormTextField
              control={control}
              name="name"
              label="Họ tên"
              required
              autoComplete="off"
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
            <FormTextField
              control={control}
              name="email"
              label="Email đăng nhập"
              type="email"
              required
              autoComplete="off"
              slotProps={{ htmlInput: { maxLength: 254 } }}
            />
            <FormTextField
              control={control}
              name="role"
              label="Quyền truy cập"
              select
              disabled={self}
            >
              <MenuItem value="user">Người dùng</MenuItem>
              <MenuItem value="admin">Quản trị viên</MenuItem>
            </FormTextField>
            <FormTextField
              control={control}
              name="status"
              label="Trạng thái"
              select
              disabled={self}
            >
              <MenuItem value="active">Hoạt động</MenuItem>
              <MenuItem value="locked">Đã khóa</MenuItem>
            </FormTextField>
            <Typography variant="body2" color="text.secondary">
              Đổi email, quyền truy cập hoặc trạng thái sẽ yêu cầu tài khoản đăng nhập lại.{' '}
              {self && 'Bạn không thể tự khóa hoặc tự hạ quyền.'}
            </Typography>
            {errors.root && <Alert severity="error">{errors.root.message}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <SubmitButton pending={isSubmitting} pendingLabel="Đang lưu…">
            Lưu thay đổi
          </SubmitButton>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}
