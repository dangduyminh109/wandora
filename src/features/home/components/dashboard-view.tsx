'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  MagnifyingGlassIcon,
  ArrowRightIcon,
  ClockCounterClockwiseIcon,
  UserCircleIcon,
  SunHorizonIcon,
  MountainsIcon,
  BankIcon,
  BuildingsIcon,
} from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { PlaceCard } from '@/features/places/components/place-card';
import { api } from '@/lib/api-client';
import type { Place } from '@/features/places/types';
import type { User } from '@/types/user';

type RecResponse = {
  personalized: Place[];
  strategy: 'collaborative' | 'interest' | 'content_based' | 'trending';
  trending: Place[];
};
interface DashboardStats {
  trendingPlaces: Place[];
  strategy: RecResponse['strategy'];
  recommendedPlaces: Place[];
  searchCount: number;
  topSearches: { value: string; count: number }[];
}

export function DashboardView({ user }: { user: User }) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      api<RecResponse>('/api/recommendations?limit=6'),
      api<{ topSearches?: { value: string; count: number }[]; total?: number }>(
        '/api/activity/stats?days=7',
      ),
    ])
      .then(([placesRes, activityRes]) => {
        if (!active) return;
        const recommendations = placesRes.status === 'fulfilled' ? placesRes.value : null;
        const activity = activityRes.status === 'fulfilled' ? activityRes.value : {};

        setStats({
          recommendedPlaces: recommendations?.personalized ?? [],
          trendingPlaces: recommendations?.trending ?? [],
          strategy: recommendations?.strategy ?? 'trending',
          searchCount: activity.total ?? 0,
          topSearches: activity.topSearches || [],
        });
      })
      .catch((err) => {
        if (active)
          setError(err instanceof Error ? err.message : 'Không tải được dữ liệu bảng điều khiển.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchInput.trim())}`);
    } else {
      router.push('/explore');
    }
  };

  const categories = [
    {
      key: 'beach',
      label: 'Biển & Đảo',
      icon: SunHorizonIcon,
      color: '#0284c7',
      desc: 'Bãi tắm, vịnh biển, san hô',
    },
    {
      key: 'nature',
      label: 'Núi & Thiên nhiên',
      icon: MountainsIcon,
      color: '#059669',
      desc: 'Đỉnh núi, thác nước, rừng già',
    },
    {
      key: 'cultural',
      label: 'Văn hóa & Di sản',
      icon: BankIcon,
      color: '#d97706',
      desc: 'Phố cổ, đền chùa, di tích',
    },
    {
      key: 'urban',
      label: 'Đô thị & Giải trí',
      icon: BuildingsIcon,
      color: '#7c3aed',
      desc: 'Thành phố, ẩm thực, mua sắm',
    },
  ];

  return (
    <Box sx={{ pb: 6 }}>
      {/* ── WELCOME BANNER ── */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          borderRadius: 3.5,
          background: 'linear-gradient(135deg, #075985 0%, #0c4a6e 100%)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 260,
            height: 260,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }}
        />

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 3 }}
        >
          <Box sx={{ maxWidth: 580 }}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Chip
                label={user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                size="small"
                sx={{
                  bgcolor:
                    user.role === 'admin'
                      ? 'rgba(56, 189, 248, 0.22)'
                      : 'rgba(255, 255, 255, 0.16)',
                  color: user.role === 'admin' ? '#7dd3fc' : '#ffffff',
                  border: `1px solid ${
                    user.role === 'admin' ? 'rgba(56, 189, 248, 0.5)' : 'rgba(255, 255, 255, 0.35)'
                  }`,
                  fontWeight: 700,
                  fontSize: '.75rem',
                  letterSpacing: '0.02em',
                }}
              />
              <Typography sx={{ fontSize: '.875rem', color: 'rgba(255,255,255,0.85)' }}>
                {user.email}
              </Typography>
            </Stack>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#fff', mb: 1 }}>
              Xin chào, {user.name}!
            </Typography>
            <Typography
              sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '.9375rem', lineHeight: 1.6 }}
            >
              Khám phá các điểm đến mới, quản lý thông tin lưu trú và trải nghiệm du lịch khắp Việt
              Nam.
            </Typography>
          </Box>

          <Stack direction="row" sx={{ gap: 1.5, flexShrink: 0 }}>
            <Button
              component={Link}
              href="/profile"
              variant="outlined"
              startIcon={<UserCircleIcon size={18} />}
              sx={{
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.3)',
                bgcolor: 'rgba(255,255,255,0.08)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.18)', borderColor: '#fff' },
              }}
            >
              Hồ sơ cá nhân
            </Button>
          </Stack>
        </Stack>

        {/* Search Bar inside banner */}
        <Box component="form" onSubmit={handleSearchSubmit} sx={{ mt: 3.5, maxWidth: 640 }}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm địa điểm, vịnh, thành phố, khách sạn..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <MagnifyingGlassIcon size={20} color="#075985" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      type="submit"
                      variant="contained"
                      size="small"
                      sx={{ px: 2, borderRadius: 1.5 }}
                    >
                      Tìm kiếm
                    </Button>
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: '#fff',
                  borderRadius: 2.5,
                  pr: 0.75,
                  '& fieldset': { border: 'none' },
                },
              },
            }}
          />
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── CATEGORY SHORTCUTS ── */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#163047', mb: 2 }}>
          Khám phá theo danh mục
        </Typography>
        <Grid container spacing={2.5}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Grid key={cat.key} size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper
                  variant="outlined"
                  component={Link}
                  href={`/explore?category=${cat.key}`}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      borderColor: cat.color,
                      boxShadow: `0 8px 24px ${cat.color}18`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      bgcolor: `${cat.color}14`,
                      color: cat.color,
                      display: 'flex',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={26} weight="duotone" />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: '#163047', fontSize: '1rem' }}>
                      {cat.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cat.desc}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* ── RECOMMENDED DESTINATIONS FROM API ── */}
      <Box sx={{ mb: 5 }}>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#163047' }}>
              Gợi ý dành riêng cho bạn
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stats?.strategy === 'collaborative'
                ? 'Dựa trên người dùng có sở thích tương tự bạn'
                : stats?.strategy === 'interest'
                  ? 'Dựa trên các tiện ích bạn đã tìm kiếm'
                  : stats?.strategy === 'content_based'
                    ? 'Dựa trên danh mục và vùng miền bạn quan tâm'
                    : 'Gợi ý các điểm đến nổi bật nhất hệ thống'}
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/explore"
            variant="text"
            endIcon={<ArrowRightIcon size={16} />}
            sx={{ fontWeight: 600 }}
          >
            Khám phá tất cả
          </Button>
        </Stack>

        <Grid container spacing={3}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: 180 }}>
                  <Skeleton width="40%" height={24} sx={{ mb: 1 }} />
                  <Skeleton width="80%" height={32} sx={{ mb: 1 }} />
                  <Skeleton width="60%" height={20} sx={{ mb: 2 }} />
                  <Skeleton width="100%" height={40} />
                </Paper>
              </Grid>
            ))
          ) : stats?.recommendedPlaces.length ? (
            stats.recommendedPlaces.map((place) => (
              <Grid key={place.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <PlaceCard place={place} showTags />
              </Grid>
            ))
          ) : (
            <Grid size={{ xs: 12 }}>
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                <Typography color="text.secondary">Chưa có địa điểm đề xuất.</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>

      {stats && stats.trendingPlaces.length > 0 && (
        <Card
          title="Địa điểm thịnh hành được đánh giá cao"
          description="Các điểm đến thu hút nhiều lượt tương tác"
        >
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            }}
          >
            {stats.trendingPlaces.slice(0, 3).map((place) => (
              <PlaceCard key={place.id} place={place} compact />
            ))}
          </Box>
        </Card>
      )}

      {/* ── ACTIVITY & AUDIT LOG SHORTCUT ── */}
      <Paper variant="outlined" sx={{ p: 3.5, borderRadius: 3, bgcolor: '#f8fafc' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 2.5 }}
        >
          <Stack direction="row" sx={{ gap: 2, alignItems: 'center' }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2.5,
                bgcolor: '#07598514',
                color: '#075985',
                display: 'flex',
              }}
            >
              <ClockCounterClockwiseIcon size={28} weight="duotone" />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#163047' }}>
                Đã xem gần đây
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tìm lại những điểm đến bạn đã khám phá và tiếp tục lên kế hoạch cho chuyến đi.
              </Typography>
            </Box>
          </Stack>
          <Button
            component={Link}
            href="/activity"
            variant="contained"
            endIcon={<ArrowRightIcon size={16} />}
            sx={{ flexShrink: 0, borderRadius: 2 }}
          >
            Xem lại địa điểm
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
