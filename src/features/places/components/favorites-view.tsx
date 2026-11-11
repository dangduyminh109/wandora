'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Box, Pagination, Skeleton, Stack, Typography } from '@mui/material';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { api } from '@/lib/api-client';
import type { Place } from '../types';
import { PlaceCard } from './place-card';

const PAGE_SIZE = 12;

export function FavoritesView() {
  const [page, setPage] = useState(0);
  const [result, setResult] = useState({ places: [] as Place[], total: 0 });
  const [resolvedKey, setResolvedKey] = useState('');
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  const requestKey = `${page}|${reload}`;
  const loading = resolvedKey !== requestKey;

  useEffect(() => {
    let active = true;
    api<{ places: Place[]; total: number }>(
      `/api/places/favorites?page=${page}&pageSize=${PAGE_SIZE}`,
    )
      .then((data) => {
        if (!active) return;
        setResult(data);
        setError('');
        setResolvedKey(requestKey);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách yêu thích.');
        setResolvedKey(requestKey);
      });
    return () => {
      active = false;
    };
  }, [page, reload, requestKey]);

  const pageCount = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="Địa điểm yêu thích"
        description="Danh sách các địa điểm du lịch bạn đã lưu lại để chuẩn bị cho hành trình tiếp theo."
      />

      {error ? (
        <ErrorState message={error} onRetry={() => setReload((v) => v + 1)} />
      ) : loading && result.places.length === 0 ? (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          }}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} variant="rounded" height={420} />
          ))}
        </Box>
      ) : result.places.length === 0 ? (
        <EmptyState
          title="Chưa có địa điểm yêu thích nào"
          description="Hãy khám phá các danh thắng nổi tiếng và bấm vào biểu tượng trái tim để lưu lại nhé."
          action={
            <Link href="/explore" style={{ textDecoration: 'none' }}>
              <Typography color="primary.main" sx={{ fontWeight: 600 }}>
                Khám phá địa điểm ngay →
              </Typography>
            </Link>
          }
        />
      ) : (
        <>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Đã lưu {result.total} địa điểm
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            }}
          >
            {result.places.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                favoriteProps={{ initialFavorited: true, onToggle: () => setReload((v) => v + 1) }}
              />
            ))}
          </Box>
          {result.total > PAGE_SIZE && (
            <Stack sx={{ alignItems: 'center', mt: 4 }}>
              <Pagination
                count={pageCount}
                page={page + 1}
                onChange={(_, value) => setPage(value - 1)}
                shape="rounded"
              />
            </Stack>
          )}
        </>
      )}
    </>
  );
}
