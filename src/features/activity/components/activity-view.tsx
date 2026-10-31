'use client';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { api } from '@/lib/api-client';
import type { Activity } from '../schemas';
import type { summarizeActivity } from '../summary';

type Stats = ReturnType<typeof summarizeActivity> & { truncated: boolean };
type History = { events: Activity[]; next: string | null };
export function ActivityView() {
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [reload, setReload] = useState(0);
  const [state, setState] = useState<{ key: string; history: History; stats: Stats }>();
  const [error, setError] = useState('');
  const [more, setMore] = useState(false);
  const key = `${day}:${reload}`;
  useEffect(() => {
    let active = true;
    Promise.all([
      api<History>(`/api/activity?day=${encodeURIComponent(day)}`),
      api<Stats>('/api/activity/stats?days=7'),
    ])
      .then(([history, stats]) => {
        if (active) {
          setState({ key, history, stats });
          setError('');
        }
      })
      .catch(() => {
        if (active) setError('Không tải được lịch sử. Vui lòng thử lại.');
      });
    return () => {
      active = false;
    };
  }, [day, key]);
  const loading = state?.key !== key;
  return (
    <>
      <PageHeader
        title="Lịch sử hoạt động"
        description="Xem lại hoạt động và các chủ đề bạn quan tâm. Lịch sử được giữ tối đa 90 ngày; ngày được tính theo UTC."
      />
      <Stack sx={{ gap: 3 }}>
        <TextField
          type="date"
          label="Ngày hoạt động (UTC)"
          value={day}
          disabled={more}
          slotProps={{ inputLabel: { shrink: true } }}
          onChange={(e) => {
            if (e.target.value) {
              setError('');
              setDay(e.target.value);
            }
          }}
        />
        {error ? (
          <ErrorState
            message={error}
            onRetry={() => {
              setError('');
              setReload((n) => n + 1);
            }}
          />
        ) : loading ? (
          <Skeleton variant="rounded" height={160} aria-label="Đang tải lịch sử" />
        ) : (
          state && (
            <>
              <Card title="Hoạt động trong 7 ngày qua">
                {state.stats.truncated && (
                  <Alert severity="info">Thống kê dựa trên tối đa 1.000 hoạt động mỗi ngày.</Alert>
                )}
                <Typography>
                  {state.stats.views} lượt xem địa điểm · {state.stats.searches} lượt tìm kiếm
                </Typography>
                <Typography>
                  Khu vực quan tâm:{' '}
                  {state.stats.topRegions.map((r) => `${r.value} (${r.count})`).join(', ') ||
                    'Chưa có dữ liệu'}
                </Typography>
                <Typography>
                  Từ khóa thường tìm:{' '}
                  {state.stats.topSearches.map((r) => `${r.value} (${r.count})`).join(', ') ||
                    'Chưa có dữ liệu'}
                </Typography>
              </Card>
              <Card title="Hoạt động trong ngày">
                {state.history.events.length === 0 ? (
                  <EmptyState
                    title="Chưa có hoạt động"
                    description="Tìm kiếm hoặc mở một địa điểm trong trang Khám phá để bắt đầu."
                  />
                ) : (
                  <List>
                    {state.history.events.map((event) => (
                      <ListItem key={event.id} disableGutters>
                        <ListItemText
                          primary={`${event.type === 'place_view' ? 'Đã xem' : 'Đã tìm'}: ${event.label}`}
                          secondary={new Date(event.occurredAt).toLocaleString('vi-VN')}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
                {state.history.next && (
                  <Button
                    disabled={more}
                    onClick={async () => {
                      setMore(true);
                      try {
                        const next = await api<History>(
                          `/api/activity?day=${encodeURIComponent(day)}&before=${state.history.next}`,
                        );
                        setState((current) =>
                          current?.key === key
                            ? {
                                ...current,
                                history: {
                                  events: [...current.history.events, ...next.events],
                                  next: next.next,
                                },
                              }
                            : current,
                        );
                      } catch {
                        setError('Không tải được hoạt động tiếp theo. Vui lòng thử lại.');
                      } finally {
                        setMore(false);
                      }
                    }}
                  >
                    {more ? 'Đang tải…' : 'Xem thêm'}
                  </Button>
                )}
              </Card>
            </>
          )
        )}
      </Stack>
    </>
  );
}
