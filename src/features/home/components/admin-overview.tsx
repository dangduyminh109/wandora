'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  MapPinIcon,
  BedIcon,
  ForkKnifeIcon,
  TicketIcon,
  UsersIcon,
  ArrowRightIcon,
  ArrowClockwiseIcon,
  StarIcon,
  CheckCircleIcon,
  CompassIcon,
  DatabaseIcon,
} from '@phosphor-icons/react';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api-client';
import { categoryLabel } from '@/features/places/constants';
import type { Place } from '@/features/places/types';

interface StatsState {
  places: number;
  hotels: number;
  restaurants: number;
  services: number;
  users: number;
  activityCount: number;
  recentPlaces: Place[];
}

export function AdminOverview() {
  const [stats, setStats] = useState<StatsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [placesRes, hotelsRes, restRes, servRes, usersRes, activityRes] = await Promise.allSettled([
        api<{ places: Place[]; total: number }>('/api/places?pageSize=5&sortBy=createdAt&direction=desc'),
        api<{ total: number }>('/api/hotels?pageSize=1'),
        api<{ total: number }>('/api/restaurants?pageSize=1'),
        api<{ total: number }>('/api/services?pageSize=1'),
        api<{ total: number }>('/api/users?pageSize=1'),
        api<{ totalEvents?: number }>('/api/activity/stats?days=7'),
      ]);

      const placesData = placesRes.status === 'fulfilled' ? placesRes.value : { places: [], total: 0 };
      const hotelsData = hotelsRes.status === 'fulfilled' ? hotelsRes.value : { total: 0 };
      const restData = restRes.status === 'fulfilled' ? restRes.value : { total: 0 };
      const servData = servRes.status === 'fulfilled' ? servRes.value : { total: 0 };
      const usersData = usersRes.status === 'fulfilled' ? usersRes.value : { total: 0 };
      const activityData = activityRes.status === 'fulfilled' ? activityRes.value : { totalEvents: 0 };

      setStats({
        places: placesData.total,
        hotels: hotelsData.total,
        restaurants: restData.total,
        services: servData.total,
        users: usersData.total,
        activityCount: activityData.totalEvents || 0,
        recentPlaces: placesData.places || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải số liệu thống kê.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const cards = [
    {
      title: 'Địa điểm du lịch',
      count: stats?.places ?? 0,
      icon: MapPinIcon,
      color: '#075985',
      href: '/admin/places',
      btnText: 'Quản lý địa điểm',
    },
    {
      title: 'Khách sạn & Lưu trú',
      count: stats?.hotels ?? 0,
      icon: BedIcon,
      color: '#0369a1',
      href: '/admin/hotels',
      btnText: 'Quản lý khách sạn',
    },
    {
      title: 'Nhà hàng & Ẩm thực',
      count: stats?.restaurants ?? 0,
      icon: ForkKnifeIcon,
      color: '#0891b2',
      href: '/admin/restaurants',
      btnText: 'Quản lý nhà hàng',
    },
    {
      title: 'Dịch vụ du lịch',
      count: stats?.services ?? 0,
      icon: TicketIcon,
      color: '#0d9488',
      href: '/admin/services',
      btnText: 'Quản lý dịch vụ',
    },
    {
      title: 'Người dùng hệ thống',
      count: stats?.users ?? 0,
      icon: UsersIcon,
      color: '#7c3aed',
      href: '/admin/users',
      btnText: 'Quản lý người dùng',
    },
  ];

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Tổng quan hệ thống"
        description="Theo dõi toàn diện cơ sở dữ liệu du lịch, tài khoản thành viên và tình trạng vận hành."
        action={
          <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center' }}>
            <Tooltip title="Làm mới số liệu">
              <IconButton
                onClick={fetchStats}
                disabled={loading}
                aria-label="Làm mới"
                sx={{ border: '1px solid #e2ecf3' }}
              >
                <ArrowClockwiseIcon size={18} className={loading ? 'spin' : ''} />
              </IconButton>
            </Tooltip>
            <Button
              component={Link}
              href="/explore"
              variant="outlined"
              startIcon={<CompassIcon size={18} />}
            >
              Xem trang Khám phá
            </Button>
          </Stack>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── METRIC CARDS ── */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Grid key={c.title} size={{ xs: 12, sm: 6, lg: 2.4 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 24px rgba(7,89,133,0.08)',
                  },
                }}
              >
                <Box>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        bgcolor: `${c.color}14`,
                        color: c.color,
                        display: 'inline-flex',
                      }}
                    >
                      <Icon size={24} weight="duotone" />
                    </Box>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {c.title}
                  </Typography>
                  {loading ? (
                    <Skeleton width={80} height={42} />
                  ) : (
                    <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#163047', lineHeight: 1.1 }}>
                      {c.count.toLocaleString('vi-VN')}
                    </Typography>
                  )}
                </Box>
                <Button
                  component={Link}
                  href={c.href}
                  size="small"
                  endIcon={<ArrowRightIcon size={14} />}
                  sx={{
                    mt: 2.5,
                    p: 0,
                    justifyContent: 'flex-start',
                    color: c.color,
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                  }}
                >
                  {c.btnText}
                </Button>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* ── DATABASE STATUS & ARCHITECTURE ── */}
      <Paper variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: '#f8fafc' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          sx={{ gap: 2.5, alignItems: { md: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center' }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#07598514', color: '#075985' }}>
              <DatabaseIcon size={22} weight="duotone" />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '.9375rem', color: '#163047' }}>
                Cấu trúc đa cơ sở dữ liệu (Polyglot Persistence)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hệ thống vận hành song song 4 CSDL chuyên biệt đảm bảo hiệu năng và tính toàn vẹn.
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1.5 }}>
            {[
              { name: 'MongoDB', role: 'Dữ liệu danh mục & Geospatial' },
              { name: 'Neo4j', role: 'Đồ thị quan hệ & Phân quyền' },
              { name: 'Redis', role: 'Cache tốc độ cao (TTL 5m)' },
              { name: 'Cassandra', role: 'Lịch sử hoạt động (90 ngày)' },
            ].map((db) => (
              <Chip
                key={db.name}
                icon={<CheckCircleIcon size={14} weight="fill" color="#10b981" />}
                label={`${db.name}: ${db.role}`}
                variant="outlined"
                sx={{
                  bgcolor: '#fff',
                  fontSize: '.75rem',
                  fontWeight: 600,
                  color: '#334155',
                  borderColor: '#cbd5e1',
                }}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>

      {/* ── RECENT PLACES PREVIEW TABLE ── */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e2ecf3' }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" sx={{ color: '#163047', fontWeight: 700 }}>
                Địa điểm mới cập nhật gần đây
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Các địa điểm mới nhất được tạo và quản lý trong CSDL MongoDB.
              </Typography>
            </Box>
            <Button component={Link} href="/admin/places" variant="outlined" size="small">
              Xem tất cả ({stats?.places ?? 0})
            </Button>
          </Stack>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Tên địa điểm</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Danh mục</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Khu vực</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Đánh giá</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Ngày tạo</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton width={180} /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell><Skeleton width={100} /></TableCell>
                    <TableCell><Skeleton width={60} /></TableCell>
                    <TableCell><Skeleton width={90} /></TableCell>
                    <TableCell align="right"><Skeleton width={60} sx={{ ml: 'auto' }} /></TableCell>
                  </TableRow>
                ))
              ) : stats?.recentPlaces.length ? (
                stats.recentPlaces.map((place) => (
                  <TableRow key={place.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: '#163047' }}>{place.name}</Typography>
                      <Typography variant="caption" color="text.secondary">/{place.slug}</Typography>
                    </TableCell>
                    <TableCell>
                      <Badge label={categoryLabel(place.category)} />
                    </TableCell>
                    <TableCell sx={{ color: '#475569' }}>{place.region}</TableCell>
                    <TableCell>
                      <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                        <StarIcon size={15} color="#fbbf24" weight="fill" />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {place.ratingCount > 0 ? place.ratingAvg.toFixed(1) : 'Mới'}
                        </Typography>
                        {place.ratingCount > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            ({place.ratingCount})
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ color: '#64748b', fontSize: '.875rem' }}>
                      {new Date(place.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        component={Link}
                        href={`/explore/${place.slug}`}
                        size="small"
                        variant="text"
                      >
                        Chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Chưa có địa điểm nào trong CSDL.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
