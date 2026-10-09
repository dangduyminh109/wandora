'use client';
import { Button, type ButtonProps } from '@mui/material';
export function SubmitButton({
  pending,
  pendingLabel = 'Đang lưu…',
  children,
  disabled,
  ...props
}: ButtonProps & { pending: boolean; pendingLabel?: string }) {
  return (
    <Button
      type="submit"
      variant="contained"
      {...props}
      disabled={pending || disabled}
      aria-busy={pending}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
