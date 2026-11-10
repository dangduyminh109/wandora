'use client';
import Link from 'next/link';
import { Box, Button, Container, Grid, Stack, Typography, Avatar } from '@mui/material';
import {
  MapPinIcon,
  BedIcon,
  ForkKnifeIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  StarIcon,
  UsersIcon,
  ShieldCheckIcon,
  TicketIcon,
  CompassIcon,
  ArrowDownIcon,
} from '@phosphor-icons/react';
import { categoryLabel } from '@/features/places/constants';

export interface PublicHomeProps {
  stats?: {
    places: number;
    hotels: number;
    restaurants: number;
    services: number;
  };
  featuredPlaces?: Array<{
    id: string;
    slug: string;
    name: string;
    category: string;
    region: string;
    description: string;
    ratingAvg: number;
    ratingCount: number;
    tags: string[];
  }>;
}

/* ─── Decorative SVG background pattern ─── */
function GridPattern() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0.07,
        pointerEvents: 'none',
      }}
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}

/* ─── Glowing orb ─── */
function Orb({
  size = 400,
  top = '0%',
  right = '0%',
  opacity = 0.15,
  color = '#0ea5e9',
}: {
  size?: number;
  top?: string;
  right?: string;
  opacity?: number;
  color?: string;
}) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'absolute',
        top,
        right,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        opacity,
        pointerEvents: 'none',
        filter: 'blur(40px)',
      }}
    />
  );
}

/* ─── Stat card ─── */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography
        sx={{
          fontSize: { xs: '2rem', md: '2.75rem' },
          fontWeight: 800,
          color: '#fff',
          lineHeight: 1,
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{ mt: 0.5, color: 'rgba(255,255,255,0.65)', fontSize: '.875rem', fontWeight: 500 }}
      >
        {label}
      </Typography>
    </Box>
  );
}

/* ─── Feature card ─── */
function FeatureCard({
  icon: Icon,
  title,
  desc,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <Box
      sx={{
        p: { xs: 3, md: 4 },
        height: '100%',
        borderRadius: 4,
        border: '1px solid #e2ecf3',
        bgcolor: '#fff',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 16px 40px rgba(7,89,133,0.12)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          bgcolor: accent,
          borderRadius: '4px 4px 0 0',
        },
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          p: 1.5,
          borderRadius: 2.5,
          bgcolor: `${accent}18`,
          color: accent,
          mb: 2.5,
        }}
      >
        <Icon size={26} weight="duotone" aria-hidden="true" />
      </Box>
      <Typography variant="h4" sx={{ mb: 1, color: '#163047' }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75 }}>
        {desc}
      </Typography>
    </Box>
  );
}

/* ─── Step card ─── */
function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <Stack direction="row" sx={{ gap: 2.5, alignItems: 'flex-start' }}>
      <Avatar
        sx={{
          width: 48,
          height: 48,
          flexShrink: 0,
          bgcolor: '#075985',
          color: '#fff',
          fontWeight: 700,
          fontSize: '1rem',
        }}
      >
        {num}
      </Avatar>
      <Box sx={{ pt: 0.5 }}>
        <Typography variant="h4" sx={{ mb: 0.75, color: '#163047' }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75 }}>
          {desc}
        </Typography>
      </Box>
    </Stack>
  );
}

/* ─── Main component ─── */
export function PublicHome({ stats, featuredPlaces }: PublicHomeProps = {}) {
  return (
    <>
      {/* ══════════════════ HERO ══════════════════ */}
      <Box
        sx={{
          position: 'relative',
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          pt: '64px',
          /* High quality travel background photo */
          backgroundImage: 'url(/hero-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: { xs: 'center 40%', md: 'center 38%' },
          backgroundAttachment: { xs: 'scroll', md: 'fixed' },
        }}
      >
        {/* Layer 1: Directional dark overlay preserving text contrast on the left while keeping the photo vibrant */}
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: 0,
            background: {
              xs: 'linear-gradient(180deg, rgba(8,20,32,0.85) 0%, rgba(8,20,32,0.65) 50%, rgba(7,89,133,0.8) 100%)',
              md: 'linear-gradient(95deg, rgba(8,20,32,0.88) 0%, rgba(8,20,32,0.68) 45%, rgba(8,20,32,0.22) 75%, rgba(8,20,32,0.45) 100%)',
            },
            zIndex: 0,
          }}
        />

        {/* Layer 2: Subtle top scrim for fixed header and bottom transition into stats band */}
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(8,20,32,0.6) 0%, transparent 22%, transparent 72%, #075985 100%)',
            zIndex: 0,
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid
            container
            spacing={{ xs: 4, md: 6 }}
            sx={{ alignItems: 'center', py: { xs: 8, md: 10 } }}
          >
            <Grid size={{ xs: 12, md: 7 }}>
              {/* Badge */}
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.75,
                  borderRadius: 99,
                  border: '1px solid rgba(125,211,252,0.4)',
                  bgcolor: 'rgba(14,165,233,0.18)',
                  backdropFilter: 'blur(8px)',
                  mb: 3,
                }}
              >
                <CompassIcon size={14} color="#7dd3fc" weight="fill" />
                <Typography
                  sx={{
                    fontSize: '.75rem',
                    fontWeight: 700,
                    color: '#7dd3fc',
                    letterSpacing: '0.06em',
                  }}
                >
                  HỆ THỐNG QUẢN LÝ DU LỊCH ĐA NỀN TẢNG
                </Typography>
              </Box>

              {/* H1 */}
              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.25rem' },
                  fontWeight: 800,
                  lineHeight: 1.1,
                  color: '#fff',
                  textWrap: 'balance',
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 24px rgba(0,0,0,0.5)',
                }}
              >
                Khám phá{' '}
                <Box
                  component="span"
                  sx={{
                    position: 'relative',
                    display: 'inline-block',
                    background: 'linear-gradient(90deg, #38bdf8 0%, #7dd3fc 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  hành trình
                </Box>{' '}
                của bạn.
              </Typography>

              <Typography
                sx={{
                  mt: 3,
                  fontSize: { xs: '1rem', md: '1.15rem' },
                  color: 'rgba(255,255,255,0.85)',
                  maxWidth: 580,
                  lineHeight: 1.8,
                  textShadow: '0 1px 12px rgba(0,0,0,0.4)',
                }}
              >
                Nền tảng quản lý địa điểm, khách sạn, nhà hàng và trải nghiệm du lịch. Được xây dựng
                cho đội ngũ quản trị và thành viên đồng hành.
              </Typography>

              {/* CTAs */}
              <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ mt: 4.5, gap: 2 }}>
                <Button
                  component={Link}
                  href="/login"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowRightIcon size={18} />}
                  sx={{
                    bgcolor: '#fff',
                    color: '#075985',
                    fontWeight: 700,
                    fontSize: '1rem',
                    px: 3.5,
                    py: 1.25,
                    borderRadius: 2,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                    '&:hover': {
                      bgcolor: '#e0f2fe',
                      color: '#0369a1',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.3)',
                    },
                  }}
                >
                  Đăng nhập ngay
                </Button>
                <Button
                  href="#features"
                  component="a"
                  variant="outlined"
                  size="large"
                  endIcon={<ArrowDownIcon size={18} />}
                  sx={{
                    color: '#fff',
                    borderColor: 'rgba(255,255,255,0.4)',
                    backdropFilter: 'blur(6px)',
                    bgcolor: 'rgba(255,255,255,0.08)',
                    fontWeight: 600,
                    fontSize: '1rem',
                    px: 3.5,
                    py: 1.25,
                    borderRadius: 2,
                    '&:hover': {
                      borderColor: '#fff',
                      bgcolor: 'rgba(255,255,255,0.18)',
                    },
                  }}
                >
                  Tìm hiểu thêm
                </Button>
              </Stack>

              <Typography sx={{ mt: 3, color: 'rgba(255,255,255,0.45)', fontSize: '.8125rem' }}>
                Hệ thống nội bộ · Tài khoản được cấp bởi quản trị viên
              </Typography>
            </Grid>

            {/* Desktop right showcase card */}
            <Grid size={{ xs: 12, md: 5 }} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                sx={{
                  p: 3.5,
                  borderRadius: 4,
                  bgcolor: 'rgba(8, 24, 38, 0.65)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
                  color: '#fff',
                }}
              >
                <Stack
                  direction="row"
                  sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
                >
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 99,
                      bgcolor: 'rgba(16,185,129,0.2)',
                      border: '1px solid rgba(16,185,129,0.35)',
                    }}
                  >
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#34d399' }} />
                    <Typography sx={{ fontSize: '.6875rem', fontWeight: 600, color: '#6ee7b7' }}>
                      ĐIỂM ĐẾN NỔI BẬT
                    </Typography>
                  </Box>
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                    <StarIcon size={16} color="#fbbf24" weight="fill" />
                    <Typography sx={{ fontSize: '.875rem', fontWeight: 700, color: '#fef08a' }}>
                      4.95
                    </Typography>
                    <Typography sx={{ fontSize: '.75rem', color: 'rgba(255,255,255,0.6)' }}>
                      (1,420 đánh giá)
                    </Typography>
                  </Stack>
                </Stack>

                <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', mb: 1 }}>
                  Quần đảo Cát Bà · Vịnh Lan Hạ
                </Typography>
                <Typography
                  sx={{
                    fontSize: '.875rem',
                    color: 'rgba(255,255,255,0.7)',
                    lineHeight: 1.6,
                    mb: 3,
                  }}
                >
                  Kỳ quan thiên nhiên với hàng trăm hòn đảo đá vôi, vịnh nước ngọc bích và bãi tắm
                  hoang sơ nguyên vẹn.
                </Typography>

                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  {['Tour du thuyền', 'Chèo Kayak', 'Resort view biển', 'Hải sản tươi'].map(
                    (tag) => (
                      <Box
                        key={tag}
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          bgcolor: 'rgba(255,255,255,0.1)',
                          fontSize: '.75rem',
                          color: 'rgba(255,255,255,0.9)',
                          fontWeight: 500,
                        }}
                      >
                        {tag}
                      </Box>
                    ),
                  )}
                </Stack>

                <Stack
                  direction="row"
                  sx={{
                    pt: 2,
                    borderTop: '1px solid rgba(255,255,255,0.12)',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '.6875rem',
                        color: 'rgba(255,255,255,0.5)',
                        textTransform: 'uppercase',
                      }}
                    >
                      Khách sạn
                    </Typography>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>
                      45+ điểm
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '.6875rem',
                        color: 'rgba(255,255,255,0.5)',
                        textTransform: 'uppercase',
                      }}
                    >
                      Nhà hàng
                    </Typography>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>
                      32+ quán
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '.6875rem',
                        color: 'rgba(255,255,255,0.5)',
                        textTransform: 'uppercase',
                      }}
                    >
                      Hoạt động
                    </Typography>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>
                      18+ tour
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Container>

        {/* Scroll indicator (clickable with smooth scroll) */}
        <Box
          component="a"
          href="#features"
          aria-label="Cuộn xuống tính năng"
          sx={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            textDecoration: 'none',
            color: 'rgba(255,255,255,0.75)',
            zIndex: 2,
            transition: 'all 0.25s ease',
            '&:hover': {
              color: '#fff',
              transform: 'translateX(-50%) translateY(4px)',
            },
          }}
        >
          <Box
            sx={{
              width: 24,
              height: 40,
              borderRadius: 12,
              border: '2px solid rgba(255,255,255,0.6)',
              display: 'flex',
              justifyContent: 'center',
              pt: 1,
              bgcolor: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <Box
              sx={{
                width: 4,
                height: 8,
                borderRadius: 99,
                bgcolor: '#38bdf8',
                animation: 'scrollDot 1.6s ease-in-out infinite',
                '@keyframes scrollDot': {
                  '0%, 100%': { transform: 'translateY(0)', opacity: 1 },
                  '50%': { transform: 'translateY(6px)', opacity: 0.3 },
                },
              }}
            />
          </Box>
          <Typography sx={{ fontSize: '.6875rem', fontWeight: 600, letterSpacing: '0.12em' }}>
            CUỘN XUỐNG
          </Typography>
        </Box>
      </Box>

      {/* ══════════════════ STATS BAND ══════════════════ */}
      <Box sx={{ bgcolor: '#075985', py: { xs: 5, md: 6 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ justifyContent: 'center' }}>
            {[
              { value: `${stats?.places || 68}+`, label: 'Địa điểm du lịch' },
              { value: `${stats?.hotels || 267}+`, label: 'Khách sạn & lưu trú' },
              { value: `${stats?.restaurants || 206}+`, label: 'Nhà hàng & ẩm thực' },
              { value: `${stats?.services || 142}+`, label: 'Dịch vụ & tour' },
            ].map((s) => (
              <Grid key={s.label} size={{ xs: 6, md: 3 }}>
                <Stat value={s.value} label={s.label} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ══════════════════ FEATURES ══════════════════ */}
      <Box id="features" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#f8fafc' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <Typography
              sx={{
                fontSize: '.8125rem',
                fontWeight: 700,
                color: '#075985',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                mb: 2,
              }}
            >
              Tính năng nổi bật
            </Typography>
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: '1.875rem', md: '2.5rem' },
                fontWeight: 800,
                color: '#163047',
                letterSpacing: '-0.01em',
              }}
            >
              Mọi thứ bạn cần,
              <br />
              một nơi duy nhất.
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ mt: 2.5, maxWidth: 500, mx: 'auto', lineHeight: 1.75 }}
            >
              Wandora tập hợp toàn bộ dữ liệu du lịch vào một nền tảng quản lý thống nhất, mạnh mẽ.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {[
              {
                icon: MapPinIcon,
                title: 'Địa điểm du lịch',
                desc: 'Quản lý và khám phá hàng trăm địa điểm du lịch nổi bật được kiểm duyệt kỹ lưỡng với thông tin chi tiết.',
                accent: '#075985',
              },
              {
                icon: BedIcon,
                title: 'Khách sạn & Lưu trú',
                desc: 'Thông tin lưu trú đầy đủ từ homestay, boutique đến resort — luôn cập nhật và chính xác.',
                accent: '#0369a1',
              },
              {
                icon: ForkKnifeIcon,
                title: 'Nhà hàng & Ẩm thực',
                desc: 'Khám phá trải nghiệm ẩm thực địa phương đặc sắc tại mọi điểm đến trên bản đồ du lịch.',
                accent: '#0891b2',
              },
              {
                icon: TicketIcon,
                title: 'Dịch vụ du lịch',
                desc: 'Tour, vé tham quan và các dịch vụ đi kèm được tổ chức gọn gàng trong một hệ thống duy nhất.',
                accent: '#0e7490',
              },
              {
                icon: MagnifyingGlassIcon,
                title: 'Tìm kiếm thông minh',
                desc: 'Tìm kiếm và lọc nhanh theo địa điểm, loại hình, giá và nhiều tiêu chí khác nhờ full-text search.',
                accent: '#1d4ed8',
              },
              {
                icon: ShieldCheckIcon,
                title: 'Quản trị & Phân quyền',
                desc: 'Hệ thống phân quyền Admin / User rõ ràng, bảo mật với JWT + refresh token xoay vòng.',
                accent: '#7c3aed',
              },
            ].map((f) => (
              <Grid key={f.title} size={{ xs: 12, sm: 6, md: 4 }}>
                <FeatureCard {...f} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ══════════════════ FEATURED DESTINATIONS FROM DB ══════════════════ */}
      {featuredPlaces && featuredPlaces.length > 0 && (
        <Box id="destinations" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#fff' }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
              <Typography
                sx={{
                  fontSize: '.8125rem',
                  fontWeight: 700,
                  color: '#075985',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  mb: 2,
                }}
              >
                Cơ sở dữ liệu điểm đến
              </Typography>
              <Typography
                component="h2"
                sx={{
                  fontSize: { xs: '1.875rem', md: '2.5rem' },
                  fontWeight: 800,
                  color: '#163047',
                  letterSpacing: '-0.01em',
                }}
              >
                Điểm đến hàng đầu Việt Nam
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mt: 2, maxWidth: 540, mx: 'auto', lineHeight: 1.75 }}
              >
                Các địa danh du lịch nổi bật được lưu trữ và đánh giá cao nhất trên hệ thống
                Wandora.
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {featuredPlaces.map((place) => (
                <Grid key={place.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box
                    sx={{
                      p: 3.5,
                      height: '100%',
                      borderRadius: 4,
                      border: '1px solid #e2ecf3',
                      bgcolor: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 16px 36px rgba(7,89,133,0.1)',
                        borderColor: '#075985',
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
                    >
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          bgcolor: 'rgba(7,89,133,0.08)',
                          color: '#075985',
                          fontSize: '.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {categoryLabel(place.category)}
                      </Box>
                      <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                        <StarIcon size={16} color="#f59e0b" weight="fill" />
                        <Typography sx={{ fontWeight: 700, fontSize: '.875rem', color: '#163047' }}>
                          {place.ratingCount > 0 ? place.ratingAvg.toFixed(1) : 'Mới'}
                        </Typography>
                        {place.ratingCount > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            ({place.ratingCount})
                          </Typography>
                        )}
                      </Stack>
                    </Stack>

                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#163047', mb: 1 }}>
                      {place.name}
                    </Typography>

                    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                      <MapPinIcon size={16} color="#075985" />
                      <Typography variant="body2" sx={{ color: '#075985', fontWeight: 600 }}>
                        {place.region}
                      </Typography>
                    </Stack>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        lineHeight: 1.7,
                        flexGrow: 1,
                        mb: 2.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {place.description || 'Chưa có mô tả chi tiết.'}
                    </Typography>

                    {place.tags && place.tags.length > 0 && (
                      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, mb: 3 }}>
                        {place.tags.slice(0, 3).map((tag) => (
                          <Box
                            key={tag}
                            sx={{
                              px: 1,
                              py: 0.25,
                              borderRadius: 1.5,
                              bgcolor: '#f1f5f9',
                              fontSize: '.75rem',
                              color: '#475569',
                              fontWeight: 500,
                            }}
                          >
                            #{tag}
                          </Box>
                        ))}
                      </Stack>
                    )}

                    <Button
                      component={Link}
                      href={`/login?redirect=/explore/${place.slug}`}
                      variant="outlined"
                      size="small"
                      endIcon={<ArrowRightIcon size={14} />}
                      sx={{
                        mt: 'auto',
                        borderRadius: 2,
                        fontWeight: 600,
                        alignSelf: 'flex-start',
                      }}
                    >
                      Xem chi tiết điểm đến
                    </Button>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ textAlign: 'center', mt: 6 }}>
              <Button
                component={Link}
                href="/login?redirect=/explore"
                variant="contained"
                size="large"
                endIcon={<ArrowRightIcon size={18} />}
                sx={{ px: 4, borderRadius: 2 }}
              >
                Đăng nhập để khám phá tất cả {stats?.places || 68}+ địa điểm
              </Button>
            </Box>
          </Container>
        </Box>
      )}

      {/* ══════════════════ HOW IT WORKS ══════════════════ */}
      <Box
        id="how-it-works"
        sx={{ py: { xs: 8, md: 12 }, bgcolor: featuredPlaces?.length ? '#f8fafc' : '#fff' }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 6, md: 10 }} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography
                sx={{
                  fontSize: '.8125rem',
                  fontWeight: 700,
                  color: '#075985',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  mb: 2,
                }}
              >
                Cách hoạt động
              </Typography>
              <Typography
                component="h2"
                sx={{
                  fontSize: { xs: '1.875rem', md: '2.25rem' },
                  fontWeight: 800,
                  color: '#163047',
                  letterSpacing: '-0.01em',
                  mb: 2,
                }}
              >
                Đơn giản từ bước đầu tiên.
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>
                Hệ thống được thiết kế để quản trị viên có thể onboard thành viên và bắt đầu quản lý
                dữ liệu du lịch ngay lập tức.
              </Typography>
              <Button
                component={Link}
                href="/login"
                variant="contained"
                endIcon={<ArrowRightIcon size={16} />}
                sx={{ mt: 4, borderRadius: 2 }}
              >
                Bắt đầu ngay
              </Button>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Stack sx={{ gap: 4 }}>
                <Step
                  num="01"
                  title="Quản trị viên tạo tài khoản"
                  desc="Admin đăng nhập và tạo tài khoản cho thành viên trong hệ thống. Không có đăng ký công khai để đảm bảo bảo mật."
                />
                <Step
                  num="02"
                  title="Thành viên đăng nhập"
                  desc="Dùng thông tin được cấp để đăng nhập. Hệ thống sử dụng JWT + refresh token xoay vòng 7 ngày."
                />
                <Step
                  num="03"
                  title="Quản lý dữ liệu du lịch"
                  desc="Thêm, chỉnh sửa địa điểm, khách sạn, nhà hàng và dịch vụ. Dữ liệu được lưu phân tán trên 4 cơ sở dữ liệu."
                />
                <Step
                  num="04"
                  title="Khám phá & đề xuất"
                  desc="Hệ thống đề xuất dựa trên quan hệ Neo4j, lịch sử hoạt động Cassandra và cache Redis tốc độ cao."
                />
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ══════════════════ TECH STACK ══════════════════ */}
      <Box
        id="tech-stack"
        sx={{ py: { xs: 6, md: 8 }, bgcolor: '#f8fafc', borderTop: '1px solid #e2ecf3' }}
      >
        <Container maxWidth="lg">
          <Typography
            sx={{
              textAlign: 'center',
              fontSize: '.8125rem',
              fontWeight: 600,
              color: '#516579',
              mb: 4,
              letterSpacing: '0.08em',
            }}
          >
            ĐƯỢC XÂY DỰNG TRÊN NỀN TẢNG
          </Typography>
          <Stack
            direction="row"
            sx={{
              flexWrap: 'wrap',
              gap: { xs: 2, md: 3 },
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {['Next.js 16', 'TypeScript', 'Neo4j', 'MongoDB', 'Redis', 'Cassandra', 'MUI v9'].map(
              (tech) => (
                <Box
                  key={tech}
                  sx={{
                    px: 2.5,
                    py: 1,
                    borderRadius: 99,
                    border: '1px solid #bdccd5',
                    bgcolor: '#fff',
                    color: '#516579',
                    fontSize: '.8125rem',
                    fontWeight: 600,
                  }}
                >
                  {tech}
                </Box>
              ),
            )}
          </Stack>
        </Container>
      </Box>

      {/* ══════════════════ FINAL CTA ══════════════════ */}
      <Box
        sx={{
          position: 'relative',
          py: { xs: 10, md: 14 },
          background: 'linear-gradient(135deg, #0c1e2e 0%, #075985 100%)',
          overflow: 'hidden',
          textAlign: 'center',
        }}
      >
        <Orb size={500} top="-30%" right="20%" opacity={0.15} color="#0ea5e9" />
        <GridPattern />
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              display: 'inline-flex',
              p: 2,
              borderRadius: 3,
              bgcolor: 'rgba(14,165,233,0.15)',
              color: '#38bdf8',
              mb: 3,
            }}
          >
            <UsersIcon size={32} weight="duotone" />
          </Box>
          <Typography
            component="h2"
            sx={{
              fontSize: { xs: '2rem', md: '2.75rem' },
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            Sẵn sàng bắt đầu hành trình?
          </Typography>
          <Typography sx={{ mt: 2.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75 }}>
            Đăng nhập để truy cập không gian cá nhân, quản lý địa điểm và khám phá những hành trình
            mới.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            sx={{ mt: 5, gap: 2, justifyContent: 'center' }}
          >
            <Button
              component={Link}
              href="/login"
              variant="contained"
              size="large"
              endIcon={<ArrowRightIcon size={18} />}
              sx={{
                bgcolor: '#fff',
                color: '#075985',
                fontWeight: 700,
                px: 4,
                borderRadius: 2,
                '&:hover': { bgcolor: '#e0f2fe' },
              }}
            >
              Đăng nhập Wandora
            </Button>
          </Stack>
          <Typography sx={{ mt: 3, color: 'rgba(255,255,255,0.3)', fontSize: '.8125rem' }}>
            Nhóm 404 · Đồ án NoSQL
          </Typography>
        </Container>
      </Box>
    </>
  );
}
