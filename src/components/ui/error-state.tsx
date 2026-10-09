'use client';
import { Alert, Button } from '@mui/material';
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert
      severity="error"
      role="alert"
      action={
        onRetry ? (
          <Button color="inherit" onClick={onRetry}>
            Thử lại
          </Button>
        ) : undefined
      }
    >
      {message}
    </Alert>
  );
}
