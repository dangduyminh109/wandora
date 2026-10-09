'use client';
import { Button } from '@mui/material';
import { SystemPage } from '@/components/layout/system-page';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <SystemPage
      title="Chưa thể mở Wandora"
      description="Dịch vụ tạm thời chưa sẵn sàng. Vui lòng thử lại sau."
      action={
        <Button variant="contained" onClick={reset}>
          Thử lại
        </Button>
      }
    />
  );
}
