'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Card as MuiCard,
  CardActionArea,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { MapPinIcon, StarIcon, CompassIcon, HeartIcon } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { api } from '@/lib/api-client';
import { categoryLabel } from '@/features/places/constants';
import type { Place } from '@/features/places/types';
import type { User } from '@/types/user';
import { FavoriteButton } from '@/features/places/components/favorite-button';

type RecResponse = {
  personalized: Place[];
  strategy: 'collaborative' | 'content_based' | 'trending';
  trending: Place[];
};

export function DashboardView({ user }: { user: User }) {
  const [data, setData] = useState<RecResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<RecResponse>('/api/recommendations?limit=6')
      .then((res) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const strategyLabel = {
    collaborative: 'Dựa trên người dùng có sở thích tương tự bạn',
    content_based: 'Dựa trên danh mục và vùng miền bạn quan tâm',
    trending: 'Gợi ý các điểm đến nổi bật nhất hệ thống',
  };

  return (
    <>
      <PageHeader
        title={'Xin chào, ' + user.name}
        description="Chào mừng trở lại không gian du lịch của bạn."
        action={
          <Button
            component={Link}
            href="/explore"
            variant="contained"
            startIcon={<CompassIcon />}
          >
            Khám phá điểm đến
          </Button>
        }
      />

      <Stack spacing={4}>
        {/* Khối gợi ý cá nhân hóa (Neo4j Graph Recommendation - FR13) */}
        <Card
          title="Gợi ý dành riêng cho bạn"
          description={data ? strategyLabel[data.strategy] : 'Đang phân tích sở thích...'}
          action={
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Badge
                label={
                  data?.strategy === 'collaborative'
                    ? 'Lọc cộng tác'
                    : data?.strategy === 'content_based'
                      ? 'Theo sở thích'
                      : 'Thịnh hành'
                }
                color="primary"
              />
            </Stack>
          }
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : !data || data.personalized.length === 0 ? (
            <Typography color="text.secondary">
              Chưa có dữ liệu gợi ý. Hãy bắt đầu khám phá và thích một vài địa điểm nhé!
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              }}
            >
              {data.personalized.map((place) => (
                <MuiCard key={place.id} variant="outlined" sx={{ position: 'relative' }}>
                  <Box sx={{ position: 'absolute', top: 14, right: 14, zIndex: 2 }}>
                    <FavoriteButton placeId={place.id} size="small" />
                  </Box>
                  <CardActionArea component={Link} href={`/explore/${place.slug}`} sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack
                        direction="row"
                        sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1, pr: 4.5 }}
                      >
                        <Badge label={categoryLabel(place.category)} />
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                          <StarIcon size={15} weight="fill" color="#eab308" />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {place.ratingAvg ? place.ratingAvg.toFixed(1) : 'Mới'}
                          </Typography>
                        </Stack>
                      </Stack>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {place.name}
                      </Typography>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary', mb: 1 }}>
                        <MapPinIcon size={14} />
                        <Typography variant="caption">{place.region}</Typography>
                      </Stack>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
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
          )}
        </Card>

        {/* Khối địa điểm thịnh hành (FR14) */}
        {data && data.trending.length > 0 && (
          <Card title="Địa điểm thịnh hành được đánh giá cao" description="Các điểm đến thu hút nhiều lượt tương tác">
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              }}
            >
              {data.trending.slice(0, 3).map((place) => (
                <MuiCard key={place.id} variant="outlined" sx={{ position: 'relative' }}>
                  <Box sx={{ position: 'absolute', top: 14, right: 14, zIndex: 2 }}>
                    <FavoriteButton placeId={place.id} size="small" />
                  </Box>
                  <CardActionArea component={Link} href={`/explore/${place.slug}`} sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1, pr: 4.5 }}>
                        <Badge label={categoryLabel(place.category)} />
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                          <StarIcon size={15} weight="fill" color="#eab308" />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {place.ratingAvg ? place.ratingAvg.toFixed(1) : 'Mới'}
                          </Typography>
                        </Stack>
                      </Stack>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {place.name}
                      </Typography>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                        <MapPinIcon size={14} />
                        <Typography variant="caption">{place.region}</Typography>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </MuiCard>
              ))}
            </Box>
          </Card>
        )}

        {/* Thông tin tài khoản */}
        <Card
          title="Tài khoản của bạn"
          action={
            <Badge label={user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'} color="primary" />
          }
        >
          <Typography color="text.secondary">{user.email}</Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button component={Link} href="/profile" variant="outlined">
              Xem hồ sơ
            </Button>
            <Button component={Link} href="/favorites" variant="outlined" startIcon={<HeartIcon />}>
              Địa điểm đã lưu
            </Button>
            {user.role === 'admin' && (
              <Button component={Link} href="/admin" variant="contained">
                Mở trang quản trị
              </Button>
            )}
          </Stack>
        </Card>
      </Stack>
    </>
  );
}
