'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { refreshSession } from '@/lib/api-client';
import { Container, Skeleton } from '@mui/material';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
export function SessionGate() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    refreshSession()
      .then((response) => {
        if (!active) return;
        if (response.ok) router.refresh();
        else if (response.status === 401) router.replace('/login');
        else setError('Không thể kết nối dịch vụ. Vui lòng thử lại.');
      })
      .catch(() => {
        if (active) setError('Không thể kết nối dịch vụ. Vui lòng thử lại.');
      });
    return () => {
      active = false;
    };
  }, [router, attempt]);
  return (
    <Container component="main" id="main" maxWidth="sm" sx={{ py: 6 }}>
      <Card title="Đang mở Wandora">
        {error ? (
          <ErrorState
            message={error}
            onRetry={() => {
              setError('');
              setAttempt((value) => value + 1);
            }}
          />
        ) : (
          <Skeleton height={48} aria-label="Đang kiểm tra phiên đăng nhập" />
        )}
      </Card>
    </Container>
  );
}
