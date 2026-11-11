'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import {
  ArrowSquareOutIcon,
  BedIcon,
  ClockIcon,
  ForkKnifeIcon,
  MapPinIcon,
  PhoneIcon,
  ShareNetworkIcon,
  SparkleIcon,
  StarIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import type { CatalogItem } from '@/features/catalog/server/repository';
import type { HotelInput, RestaurantInput, ServiceInput } from '@/features/catalog/schemas';
import { PlaceViewTracker } from '@/features/activity/components/place-view-tracker';
import { categoryLabel } from '../constants';
import type { Place } from '../types';
import { FavoriteButton } from './favorite-button';
import { PlaceGallery } from './place-gallery';
import { PlaceReviews } from './place-reviews';
import { RelatedPlaces } from './related-places';

const priceText = (level: number) => '₫'.repeat(Math.max(1, Math.min(4, level)));

const serviceTypeLabel: Record<string, string> = {
  tour: 'Tour trải nghiệm',
  transport: 'Phương tiện di chuyển',
  ticket: 'Vé tham quan',
  other: 'Dịch vụ khác',
};

type Props = {
  place: Place;
  hotels: CatalogItem<HotelInput>[];
  restaurants: CatalogItem<RestaurantInput>[];
  services: CatalogItem<ServiceInput>[];
};

export function PlaceDetailView({ place, hotels, restaurants, services }: Props) {
  const [lng, lat] = place.location.coordinates;
  const [activeTab, setActiveTab] = useState(() => {
    if (hotels.length > 0) return 0;
    if (restaurants.length > 0) return 1;
    if (services.length > 0) return 2;
    return 0;
  });

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      toast.success('Đã sao chép liên kết vào bộ nhớ tạm!');
    }
  };

  const totalCatalogCount = hotels.length + restaurants.length + services.length;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <PlaceViewTracker placeId={place.id} />

      {/* ── BREADCRUMBS ── */}
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 0.5 }}
        aria-label="Đường dẫn trang"
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
              '&:hover': { color: 'primary.main', textDecoration: 'underline' },
            }}
          >
            Trang chủ
          </Typography>
        </Link>
        <Typography variant="body2" sx={{ color: 'divider' }}>
          /
        </Typography>
        <Link href="/explore" style={{ textDecoration: 'none' }}>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
              '&:hover': { color: 'primary.main', textDecoration: 'underline' },
            }}
          >
            Khám phá
          </Typography>
        </Link>
        <Typography variant="body2" sx={{ color: 'divider' }}>
          /
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
          {place.name}
        </Typography>
      </Stack>

      {/* ── PAGE TITLE & ACTIONS ── */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'flex-end' },
          mb: 3,
        }}
      >
        <Box sx={{ maxWidth: 800 }}>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: '1.875rem', sm: '2.25rem', md: '2.5rem' },
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'text.primary',
              mb: 1.5,
            }}
          >
            {place.name}
          </Typography>

          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            {/* Rating pill */}
            <Chip
              icon={<StarIcon size={16} weight="fill" color="#f59e0b" />}
              label={
                place.ratingCount > 0
                  ? `${place.ratingAvg.toFixed(1)} (${place.ratingCount} đánh giá)`
                  : 'Chưa có đánh giá'
              }
              size="small"
              onClick={() => {
                document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              sx={{
                fontWeight: 600,
                cursor: 'pointer',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            />

            {/* Category badge */}
            <Chip
              label={categoryLabel(place.category)}
              size="small"
              sx={{
                fontWeight: 600,
                bgcolor: 'rgba(7, 89, 133, 0.08)',
                color: 'primary.main',
                border: '1px solid rgba(7, 89, 133, 0.2)',
              }}
            />

            {/* Location pin */}
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
              <MapPinIcon size={16} weight="bold" />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {place.region}
                {place.address && place.address !== place.region ? ` · ${place.address}` : ''}
              </Typography>
            </Stack>
          </Stack>
        </Box>

        {/* Action buttons */}
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box
            sx={{
              p: 0.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <FavoriteButton placeId={place.id} />
          </Box>
          <Button
            variant="outlined"
            size="medium"
            startIcon={<ShareNetworkIcon size={18} />}
            onClick={handleShare}
            sx={{ borderRadius: 2 }}
          >
            Chia sẻ
          </Button>
          <Button
            variant="contained"
            size="medium"
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<MapPinIcon size={18} />}
            endIcon={<ArrowSquareOutIcon size={14} />}
            sx={{ borderRadius: 2 }}
          >
            Xem bản đồ
          </Button>
        </Stack>
      </Stack>

      {/* ── MAIN CONTENT STACK ── */}
      <Stack spacing={4}>
        {/* 1. Photo Gallery */}
        <PlaceGallery images={place.images} name={place.name} />

        {/* 2. Overview & Key Information Card */}
        <Card>
          <Stack spacing={2.5}>
            {/* Tags & Quick category badges */}
            {place.tags && place.tags.length > 0 && (
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {place.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={`#${tag}`}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: 'divider',
                      color: 'text.secondary',
                      bgcolor: 'background.default',
                      fontWeight: 500,
                    }}
                  />
                ))}
              </Stack>
            )}

            {/* Description */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                Giới thiệu điểm đến
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'text.primary',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-line',
                }}
              >
                {place.description || 'Chưa có thông tin mô tả chi tiết cho địa điểm này.'}
              </Typography>
            </Box>

            <Divider />

            {/* Quick Specs / Information Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 2,
              }}
            >
              <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Khu vực
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {place.region}
                </Typography>
              </Box>

              <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Danh mục
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {categoryLabel(place.category)}
                </Typography>
              </Box>

              <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Đánh giá
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 0.5, color: '#d97706' }}>
                  {place.ratingCount > 0
                    ? `★ ${place.ratingAvg.toFixed(1)} / 5.0 (${place.ratingCount})`
                    : 'Chưa có'}
                </Typography>
              </Box>

              <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Dịch vụ xung quanh
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 0.5, color: 'primary.main' }}>
                  {totalCatalogCount > 0 ? `${totalCatalogCount} địa điểm` : 'Đang cập nhật'}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Card>

        {/* 3. Catalog Section: Khách sạn / Nhà hàng / Dịch vụ (Modern Tabs) */}
        <Card
          title="Dịch vụ & Tiện ích lân cận"
          description="Khám phá các khách sạn, điểm ăn uống và dịch vụ trải nghiệm quanh điểm đến"
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab
                icon={<BedIcon size={18} />}
                iconPosition="start"
                label={`Khách sạn (${hotels.length})`}
                sx={{ minHeight: 48, fontWeight: 600 }}
              />
              <Tab
                icon={<ForkKnifeIcon size={18} />}
                iconPosition="start"
                label={`Nhà hàng (${restaurants.length})`}
                sx={{ minHeight: 48, fontWeight: 600 }}
              />
              <Tab
                icon={<SparkleIcon size={18} />}
                iconPosition="start"
                label={`Dịch vụ (${services.length})`}
                sx={{ minHeight: 48, fontWeight: 600 }}
              />
            </Tabs>
          </Box>

          {/* TAB 0: HOTELS */}
          {activeTab === 0 && (
            hotels.length === 0 ? (
              <EmptyCatalogState message="Chưa có khách sạn nào được liên kết với địa điểm này." />
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                  gap: 2.5,
                }}
              >
                {hotels.map((hotel) => (
                  <CatalogItemCard
                    key={hotel.id}
                    title={hotel.name}
                    badgeMeta={`${hotel.stars}★`}
                    priceLevel={hotel.priceLevel}
                    address={hotel.address}
                    phone={hotel.phone}
                    website={hotel.website}
                    images={hotel.images}
                    illustrativeImages={hotel.illustrativeImages}
                    tags={hotel.amenities}
                  />
                ))}
              </Box>
            )
          )}

          {/* TAB 1: RESTAURANTS */}
          {activeTab === 1 && (
            restaurants.length === 0 ? (
              <EmptyCatalogState message="Chưa có nhà hàng, quán ăn nào được liên kết với địa điểm này." />
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                  gap: 2.5,
                }}
              >
                {restaurants.map((restaurant) => (
                  <CatalogItemCard
                    key={restaurant.id}
                    title={restaurant.name}
                    priceLevel={restaurant.priceLevel}
                    address={restaurant.address}
                    phone={restaurant.phone}
                    website={restaurant.website}
                    images={restaurant.images}
                    illustrativeImages={restaurant.illustrativeImages}
                    tags={restaurant.cuisine}
                    timeDetail={restaurant.openingHours}
                  />
                ))}
              </Box>
            )
          )}

          {/* TAB 2: SERVICES */}
          {activeTab === 2 && (
            services.length === 0 ? (
              <EmptyCatalogState message="Chưa có tour hoặc dịch vụ hỗ trợ nào được liên kết với địa điểm này." />
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                  gap: 2.5,
                }}
              >
                {services.map((service) => (
                  <CatalogItemCard
                    key={service.id}
                    title={service.name}
                    badgeMeta={serviceTypeLabel[service.type] ?? service.type}
                    priceLevel={service.priceLevel}
                    address={service.address}
                    phone={service.phone}
                    website={service.website}
                    images={service.images}
                    illustrativeImages={service.illustrativeImages}
                    description={service.description}
                  />
                ))}
              </Box>
            )
          )}
        </Card>

        {/* 4. Community Reviews */}
        <Box id="reviews-section">
          <PlaceReviews
            placeId={place.id}
            ratingAvg={place.ratingAvg}
            ratingCount={place.ratingCount}
          />
        </Box>

        {/* 5. Related Places */}
        <RelatedPlaces placeId={place.id} />
      </Stack>
    </Container>
  );
}

// ── SUBCOMPONENTS ──

function EmptyCatalogState({ message }: { message: string }) {
  return (
    <Box sx={{ py: 5, textAlign: 'center' }}>
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );
}

function CatalogItemCard({
  title,
  badgeMeta,
  priceLevel,
  address,
  phone,
  website,
  images,
  illustrativeImages,
  tags,
  timeDetail,
  description,
}: {
  title: string;
  badgeMeta?: string;
  priceLevel: number;
  address?: string;
  phone?: string;
  website?: string;
  images?: string[];
  illustrativeImages?: string[];
  tags?: string[];
  timeDetail?: string;
  description?: string;
}) {
  const thumb = images?.[0] || '/images/place-placeholder.svg';
  const isIllustrative = Boolean(images && images.some((img) => illustrativeImages?.includes(img)));

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 3,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.light',
          boxShadow: '0 6px 20px rgba(7, 89, 133, 0.08)',
        },
      }}
    >
      <Box>
        {/* Top Header: Image & Main Info */}
        <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Box
              component="img"
              src={thumb}
              alt={title}
              loading="lazy"
              referrerPolicy="no-referrer"
              sx={{
                width: 96,
                height: 80,
                objectFit: 'cover',
                borderRadius: 2,
                bgcolor: 'background.default',
                display: 'block',
              }}
            />
            {isIllustrative && (
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  bottom: 3,
                  left: 3,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  px: 0.5,
                  borderRadius: 0.5,
                  fontSize: '0.65rem',
                }}
              >
                Minh họa
              </Typography>
            )}
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                lineHeight: 1.3,
                mb: 0.5,
              }}
            >
              {title}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
              {badgeMeta && (
                <Chip
                  label={badgeMeta}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    height: 22,
                    fontSize: '0.75rem',
                    bgcolor: 'rgba(7, 89, 133, 0.08)',
                    color: 'primary.main',
                  }}
                />
              )}
              <Chip
                label={priceText(priceLevel)}
                size="small"
                sx={{
                  fontWeight: 700,
                  height: 22,
                  fontSize: '0.75rem',
                  bgcolor: '#ecfdf5',
                  color: '#047857',
                }}
              />
            </Stack>
          </Box>
        </Stack>

        {/* Detail descriptions & tags */}
        {timeDetail && (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary', mb: 1 }}>
            <ClockIcon size={15} />
            <Typography variant="body2">{timeDetail}</Typography>
          </Stack>
        )}

        {address && (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary', mb: 1 }}>
            <MapPinIcon size={15} />
            <Typography variant="body2" noWrap>
              {address}
            </Typography>
          </Stack>
        )}

        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </Typography>
        )}

        {tags && tags.length > 0 && (
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
            {tags.slice(0, 5).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.72rem', borderColor: 'divider' }}
              />
            ))}
            {tags.length > 5 && (
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                +{tags.length - 5}
              </Typography>
            )}
          </Stack>
        )}
      </Box>

      {/* Action footer */}
      {(phone || website) && (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            pt: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {phone ? (
            <Button
              size="small"
              variant="outlined"
              component="a"
              href={`tel:${phone}`}
              startIcon={<PhoneIcon size={15} />}
              sx={{ minHeight: 32, px: 1.5, fontSize: '0.8125rem', borderRadius: 1.5 }}
            >
              {phone}
            </Button>
          ) : (
            <Box />
          )}

          {website && (
            <Button
              size="small"
              variant="text"
              component="a"
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<ArrowSquareOutIcon size={14} />}
              sx={{ minHeight: 32, fontSize: '0.8125rem' }}
            >
              Trang web
            </Button>
          )}
        </Stack>
      )}
    </Paper>
  );
}
