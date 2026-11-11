'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Container,
  InputAdornment,
  MenuItem,
  Pagination,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { api } from '@/lib/api-client';
import { placeCategories } from '../constants';
import type { Place } from '../types';
import { AmenitySearchPanel } from './amenity-search-panel';
import { PlaceCard, PlaceGrid } from './place-card';

const PAGE_SIZE = 12;
const sortOptions = [
  { value: 'relevance', label: 'Phù hợp nhất' },
  { value: 'ratingAvg', label: 'Đánh giá cao' },
  { value: 'name', label: 'Tên A–Z' },
  { value: 'createdAt', label: 'Mới thêm' },
] as const;

export function ExploreView() {
  const recordedSearch = useRef('');
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search);
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const [minRating, setMinRating] = useState('0');
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [page, setPage] = useState(0);
  const [regions, setRegions] = useState<string[]>([]);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState({ places: [] as Place[], total: 0 });
  const [resolvedKey, setResolvedKey] = useState('');
  const [error, setError] = useState('');
  // Đang xem kết quả tìm theo tiện ích: ẩn danh sách thường, vô hiệu ô tìm từ khóa và sắp xếp.
  const [amenityActive, setAmenityActive] = useState(false);

  // "Phù hợp nhất" chỉ có ý nghĩa khi có từ khóa; không có thì xếp theo đánh giá cao.
  const effectiveSort = sortBy === 'relevance' && !debounced ? 'ratingAvg' : sortBy;
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    search: debounced,
    category,
    region,
    minRating,
    sortBy: effectiveSort,
    direction: effectiveSort === 'name' ? 'asc' : 'desc',
  }).toString();
  const requestKey = `${query}|${reload}`;
  const loading = resolvedKey !== requestKey || search !== debounced;

  useEffect(() => {
    api<{ regions: string[] }>('/api/places/regions')
      .then((data) => setRegions(data.regions))
      .catch(() => setRegions([]));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    api<{ places: Place[]; total: number }>('/api/places?' + query, { signal: controller.signal })
      .then((data) => {
        if (!active) return;
        setResult(data);
        setError('');
        setResolvedKey(requestKey);
        if (debounced && page === 0 && recordedSearch.current !== debounced) {
          recordedSearch.current = debounced;
          void api('/api/activity', {
            method: 'POST',
            body: JSON.stringify({ type: 'search', search: debounced }),
          }).catch(() => {
            /* Search remains available if analytics is down. */
          });
        }
        if (!debounced) recordedSearch.current = '';
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Không thể tải địa điểm.');
        setResolvedKey(requestKey);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [query, requestKey, debounced, page]);

  const change = (apply: () => void) => {
    apply();
    setPage(0);
  };
  const pageCount = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <PageHeader
        title="Khám phá địa điểm"
        description="Tìm điểm đến theo tên, mô tả, thẻ; lọc theo danh mục, khu vực và đánh giá."
      />

      <AmenitySearchPanel
        category={category}
        region={region}
        minRating={minRating}
        onActiveChange={setAmenityActive}
        filters={
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ alignItems: { md: 'center' } }}
          >
            <TextField
              label="Tìm kiếm"
              placeholder="Nhập tên, mô tả hoặc thẻ…"
              value={search}
              disabled={amenityActive}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <MagnifyingGlassIcon size={18} color="#64748b" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ flex: 2 }}
            />
            <TextField
              select
              label="Danh mục"
              value={category}
              onChange={(e) => change(() => setCategory(e.target.value))}
              sx={{ flex: 1, minWidth: 150 }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              {placeCategories.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Khu vực"
              value={region}
              onChange={(e) => change(() => setRegion(e.target.value))}
              sx={{ flex: 1, minWidth: 150 }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              {regions.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Đánh giá từ"
              value={minRating}
              onChange={(e) => change(() => setMinRating(e.target.value))}
              sx={{ flex: 1, minWidth: 130 }}
            >
              <MenuItem value="0">Tất cả</MenuItem>
              <MenuItem value="4.5">★ 4.5 trở lên</MenuItem>
              <MenuItem value="4">★ 4.0 trở lên</MenuItem>
              <MenuItem value="3">★ 3.0 trở lên</MenuItem>
            </TextField>
            <TextField
              select
              label="Sắp xếp"
              value={sortBy}
              disabled={amenityActive}
              onChange={(e) => change(() => setSortBy(e.target.value))}
              sx={{ flex: 1, minWidth: 150 }}
            >
              {sortOptions.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        }
      />

      {amenityActive ? null : error && resolvedKey === requestKey ? (
        <ErrorState message={error} onRetry={() => setReload((value) => value + 1)} />
      ) : (
        <>
          <Typography color="text.secondary" sx={{ mb: 2 }} aria-live="polite">
            {loading ? 'Đang tìm…' : `${result.total} địa điểm`}
          </Typography>
          {loading && result.places.length === 0 ? (
            <PlaceGrid>
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} variant="rounded" height={420} />
              ))}
            </PlaceGrid>
          ) : result.places.length === 0 ? (
            <EmptyState
              title="Không tìm thấy địa điểm"
              description="Thử từ khóa khác hoặc bỏ bớt bộ lọc."
            />
          ) : (
            <PlaceGrid sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 150ms' }}>
              {result.places.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </PlaceGrid>
          )}
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
    </Container>
  );
}
