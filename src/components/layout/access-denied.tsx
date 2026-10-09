'use client';
import { Container } from '@mui/material';
import { EmptyState } from '@/components/ui/empty-state';
export function AccessDenied({ action }: { action: React.ReactNode }) {
  return (
    <Container component="main" id="main" sx={{ py: 6 }}>
      <EmptyState
        title="Quyền truy cập giới hạn"
        description="Chỉ quản trị viên có thể truy cập không gian này."
        action={action}
      />
    </Container>
  );
}
