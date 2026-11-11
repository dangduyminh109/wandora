'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Skeleton, Stack, Typography } from '@mui/material';
import { PageHeader } from '@/components/ui/page-header';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { PlaceCard, PlaceGrid } from '@/features/places/components/place-card';
import type { Place } from '@/features/places/types';
import { api } from '@/lib/api-client';

type Recent = { items: { place: Place; viewedAt: string }[]; truncated: boolean };
export function ActivityView() {
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<Recent>();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api<Recent>('/api/activity/recent')
      .then((data) => {
        if (active) {
          setResult(data);
          setError('');
        }
      })
      .catch(() => {
        if (active) setError('Không tải được địa điểm đã xem. Vui lòng thử lại.');
      });
    return () => {
      active = false;
    };
  }, [reload]);
  return (
    <>
      <PageHeader
        title="Đã xem gần đây"
        description="Mở lại những điểm đến bạn đã khám phá trong 30 ngày qua. Mỗi địa điểm chỉ hiển thị một lần, theo lần xem mới nhất."
      />
      {error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            setError('');
            setReload((n) => n + 1);
          }}
        />
      ) : !result ? (
        <PlaceGrid>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={360}
              aria-label="Đang tải địa điểm đã xem"
            />
          ))}
        </PlaceGrid>
      ) : !result.items.length ? (
        <EmptyState
          title="Bạn chưa xem địa điểm nào gần đây"
          description="Khám phá một điểm đến để dễ dàng tìm lại tại đây."
          action={
            <Button component={Link} href="/explore" variant="contained">
              Khám phá địa điểm
            </Button>
          }
        />
      ) : (
        <Stack spacing={3}>
          {result.truncated && (
            <Alert severity="info">
              Đang hiển thị các địa điểm từ những hoạt động gần nhất của bạn.
            </Alert>
          )}
          <PlaceGrid>
            {result.items.map(({ place, viewedAt }) => (
              <PlaceCard
                key={place.id}
                place={place}
                showFavorite={false}
                footer={
                  <Typography variant="body2" color="text.secondary">
                    Lần xem gần nhất:{' '}
                    <time dateTime={viewedAt}>
                      {new Date(viewedAt).toLocaleString('vi-VN', {
                        timeZone: 'Asia/Ho_Chi_Minh',
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </time>
                  </Typography>
                }
              />
            ))}
          </PlaceGrid>
        </Stack>
      )}
    </>
  );
}
