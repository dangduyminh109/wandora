'use client';
import { useEffect, useState } from 'react';
import { Button, Chip, Pagination, Skeleton, Stack, Typography } from '@mui/material';
import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { api } from '@/lib/api-client';
import { amenityCatalog, amenityLabel, type AmenityMatch } from '../amenities';
import type { Place } from '../types';
import { PlaceCard, PlaceGrid } from './place-card';

const PAGE_SIZE = 12;
const MAX_SELECTED = 10;

type Result = {
  places: (Place & { match: AmenityMatch })[];
  total: number;
  fullCount: number;
  partialCount: number;
  similarCount: number;
  similarAvailable: boolean;
};

type Props = {
  category: string;
  region: string;
  minRating: string;
  // Báo cho trang cha biết đang hiển thị kết quả theo tiện ích để ẩn danh sách thường.
  onActiveChange: (active: boolean) => void;
};

// Tìm theo tiện ích: chọn nhiều tiện ích rồi bấm "Tìm theo tiện ích" mới gọi API (không tìm theo từng lần chọn).
export function AmenitySearchPanel({ category, region, minRating, onActiveChange }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  // Bộ tiện ích đã được bấm tìm; đổi lựa chọn ở trên không làm kết quả bên dưới thay đổi cho tới lần bấm sau.
  const [submitted, setSubmitted] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [resolvedKey, setResolvedKey] = useState('');
  const [error, setError] = useState('');

  const active = submitted.length > 0;
  const query = new URLSearchParams({
    amenities: submitted.join(','),
    category,
    region,
    minRating,
    page: String(page),
    pageSize: String(PAGE_SIZE),
  }).toString();
  const requestKey = `${query}|${reload}`;
  const loading = active && resolvedKey !== requestKey;

  useEffect(() => {
    onActiveChange(active);
  }, [active, onActiveChange]);

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    let current = true;
    api<Result>('/api/places/by-amenities?' + query, { signal: controller.signal })
      .then((data) => {
        if (!current) return;
        setResult(data);
        setError('');
        setResolvedKey(requestKey);
      })
      .catch((err) => {
        if (!current || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Không thể tìm theo tiện ích.');
        setResolvedKey(requestKey);
      });
    return () => {
      current = false;
      controller.abort();
    };
  }, [active, query, requestKey]);

  const toggle = (code: string) =>
    setSelected((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : current.length < MAX_SELECTED
          ? [...current, code]
          : current,
    );

  const search = () => {
    if (selected.length === 0) return;
    setPage(0);
    setSubmitted(selected);
    // Ghi lịch sử tìm kiếm; lỗi analytics không được làm hỏng việc tìm kiếm.
    void api('/api/activity', {
      method: 'POST',
      body: JSON.stringify({
        type: 'search',
        search: `Tiện ích: ${selected.map(amenityLabel).join(', ')}`.slice(0, 100),
        amenities: selected,
      }),
    }).catch(() => {});
  };

  const clear = () => {
    setSelected([]);
    setSubmitted([]);
    setResult(null);
    setError('');
    setPage(0);
  };

  const pageCount = Math.max(1, Math.ceil((result?.total ?? 0) / PAGE_SIZE));

  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      <Typography variant="h4" component="h2">
        Tìm theo tiện ích
      </Typography>
      <Stack
        direction="row"
        role="group"
        aria-label="Chọn tiện ích"
        sx={{ flexWrap: 'wrap', gap: 1 }}
      >
        {amenityCatalog.map((item) => {
          const on = selected.includes(item.value);
          return (
            <Chip
              key={item.value}
              label={item.label}
              clickable
              color={on ? 'primary' : 'default'}
              variant={on ? 'filled' : 'outlined'}
              onClick={() => toggle(item.value)}
              aria-pressed={on}
            />
          );
        })}
      </Stack>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<MagnifyingGlassIcon size={18} aria-hidden="true" />}
          disabled={selected.length === 0}
          onClick={search}
        >
          Tìm theo tiện ích
        </Button>
        {(selected.length > 0 || active) && (
          <Button variant="text" startIcon={<XIcon size={16} aria-hidden="true" />} onClick={clear}>
            Xóa lựa chọn
          </Button>
        )}
        <Typography variant="body2" color="text.secondary">
          {selected.length === 0
            ? 'Chọn một hoặc nhiều tiện ích rồi bấm tìm.'
            : `Đã chọn ${selected.length}/${MAX_SELECTED}`}
        </Typography>
      </Stack>

      {active &&
        (error && resolvedKey === requestKey ? (
          <ErrorState message={error} onRetry={() => setReload((value) => value + 1)} />
        ) : (
          <>
            <Typography color="text.secondary" aria-live="polite">
              {loading || !result
                ? 'Đang tìm…'
                : `${result.total} địa điểm: ${result.fullCount} khớp đủ, ${result.partialCount} khớp một phần, ${result.similarCount} gần giống`}
            </Typography>
            {result && !result.similarAvailable && (
              <Typography variant="body2" color="warning.main">
                Tạm thời chưa có gợi ý gần giống, chỉ hiển thị địa điểm có đúng tiện ích đã chọn.
              </Typography>
            )}
            {loading && !result ? (
              <PlaceGrid>
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} variant="rounded" height={180} />
                ))}
              </PlaceGrid>
            ) : result && result.places.length === 0 ? (
              <EmptyState
                title="Chưa có địa điểm nào có các tiện ích này"
                description="Thử bỏ bớt tiện ích hoặc bộ lọc danh mục, khu vực."
              />
            ) : (
              result && (
                <PlaceGrid sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 150ms' }}>
                  {result.places.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      footer={<MatchSummary match={place.match} />}
                    />
                  ))}
                </PlaceGrid>
              )
            )}
            {result && result.total > PAGE_SIZE && (
              <Stack sx={{ alignItems: 'center', mt: 2 }}>
                <Pagination
                  count={pageCount}
                  page={page + 1}
                  onChange={(_, value) => setPage(value - 1)}
                  shape="rounded"
                />
              </Stack>
            )}
          </>
        ))}
    </Stack>
  );
}

const matchLabels = {
  full: { label: 'Khớp đủ', color: 'success' },
  partial: { label: 'Khớp một phần', color: 'warning' },
  similar: { label: 'Gợi ý gần giống', color: 'info' },
} as const;

function MatchSummary({ match }: { match: AmenityMatch }) {
  return (
    <Stack spacing={1} sx={{ mt: 2 }}>
      <Badge label={matchLabels[match.type].label} color={matchLabels[match.type].color} />
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
        {match.matched.map((code) => (
          <Badge key={code} label={`✓ ${amenityLabel(code)}`} color="success" />
        ))}
        {match.similar.map((item) => (
          <Badge
            key={item.wanted}
            label={`≈ ${amenityLabel(item.wanted)} (có ${amenityLabel(item.via)})`}
            color="info"
          />
        ))}
        {match.missing.map((code) => (
          <Badge key={code} label={`✗ ${amenityLabel(code)}`} />
        ))}
      </Stack>
    </Stack>
  );
}
