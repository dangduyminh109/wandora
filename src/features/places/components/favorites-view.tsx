'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Card as MuiCard,
  CardActionArea,
  CardContent,
  Pagination,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { MapPinIcon, StarIcon } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { api } from '@/lib/api-client';
import { categoryLabel } from '../constants';
import type { Place } from '../types';
import { FavoriteButton } from './favorite-button';

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
            <Skeleton key={i} variant="rounded" height={180} />
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
              <MuiCard key={place.id} variant="outlined" sx={{ position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: 18, right: 18, zIndex: 2 }}>
                  <FavoriteButton
                    placeId={place.id}
                    initialFavorited={true}
                    size="small"
                    onToggle={() => setReload((v) => v + 1)}
                  />
                </Box>
                <CardActionArea
                  component={Link}
                  href={`/explore/${place.slug}`}
                  sx={{ height: '100%' }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack
                      direction="row"
                      sx={{
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                        pr: 4.5,
                      }}
                    >
                      <Badge label={categoryLabel(place.category)} />
                      <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                        <StarIcon size={16} weight="fill" aria-hidden="true" color="#eab308" />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {place.ratingCount > 0 ? place.ratingAvg.toFixed(1) : 'Mới'}
                        </Typography>
                      </Stack>
                    </Stack>
                    <Typography variant="h4" component="h2" sx={{ mb: 0.5 }}>
                      {place.name}
                    </Typography>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                      <MapPinIcon size={16} aria-hidden="true" />
                      <Typography variant="body2" color="text.secondary">
                        {place.region}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {place.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </MuiCard>
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
