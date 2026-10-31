'use client';
import { Box, Button, Container, Divider, Stack, Typography } from '@mui/material';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import type { CatalogItem } from '@/features/catalog/server/repository';
import type { HotelInput, RestaurantInput, ServiceInput } from '@/features/catalog/schemas';
import { categoryLabel } from '../constants';
import type { Place } from '../types';
import { PlaceViewTracker } from '@/features/activity/components/place-view-tracker';
import { FavoriteButton } from './favorite-button';
import { PlaceReviews } from './place-reviews';
import { RelatedPlaces } from './related-places';

const priceText = (level: number) => '₫'.repeat(level);
const serviceTypeLabel: Record<string, string> = {
  tour: 'Tour',
  transport: 'Di chuyển',
  ticket: 'Vé',
  other: 'Khác',
};

type Props = {
  place: Place;
  hotels: CatalogItem<HotelInput>[];
  restaurants: CatalogItem<RestaurantInput>[];
  services: CatalogItem<ServiceInput>[];
};

export function PlaceDetailView({ place, hotels, restaurants, services }: Props) {
  const [lng, lat] = place.location.coordinates;
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <PlaceViewTracker placeId={place.id} />
      <PageHeader
        title={place.name}
        description={`${place.region}${place.address && place.address !== place.region ? ' · ' + place.address : ''}`}
        breadcrumbs={[{ label: 'Khám phá', href: '/explore' }, { label: place.name }]}
        action={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <FavoriteButton placeId={place.id} />
            <Button
              variant="outlined"
              href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Xem trên bản đồ
            </Button>
          </Stack>
        }
      />
      <Stack sx={{ gap: 3 }}>
        <Card>
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
            <Badge label={categoryLabel(place.category)} color="primary" />
            {place.tags.map((tag) => (
              <Badge key={tag} label={tag} />
            ))}
            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
              {place.ratingCount > 0
                ? `★ ${place.ratingAvg.toFixed(1)} (${place.ratingCount} đánh giá)`
                : 'Chưa có đánh giá'}
            </Typography>
          </Stack>
          <Typography sx={{ whiteSpace: 'pre-line' }}>
            {place.description || 'Chưa có mô tả.'}
          </Typography>
        </Card>

        <Section title="Khách sạn" count={hotels.length}>
          {hotels.map((hotel) => (
            <Row
              key={hotel.id}
              title={hotel.name}
              meta={`${hotel.stars}★ · ${priceText(hotel.priceLevel)}`}
              detail={hotel.amenities.join(', ')}
              extra={hotel.phone}
            />
          ))}
        </Section>
        <Section title="Nhà hàng" count={restaurants.length}>
          {restaurants.map((item) => (
            <Row
              key={item.id}
              title={item.name}
              meta={priceText(item.priceLevel)}
              detail={[item.cuisine.join(', '), item.openingHours].filter(Boolean).join(' · ')}
              extra={item.phone}
            />
          ))}
        </Section>
        <Section title="Dịch vụ" count={services.length}>
          {services.map((item) => (
            <Row
              key={item.id}
              title={item.name}
              meta={`${serviceTypeLabel[item.type] ?? item.type} · ${priceText(item.priceLevel)}`}
              detail={item.description}
              extra={item.phone}
            />
          ))}
        </Section>

        {/* Đánh giá và bình luận (FR08 - MongoDB & Neo4j) */}
        <PlaceReviews
          placeId={place.id}
          ratingAvg={place.ratingAvg}
          ratingCount={place.ratingCount}
        />

        {/* Địa điểm tương tự (FR14 - Neo4j Graph traversal) */}
        <RelatedPlaces placeId={place.id} />
      </Stack>
    </Container>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Card title={title} description={`${count} lựa chọn`}>
      {count === 0 ? (
        <Typography color="text.secondary">Chưa có dữ liệu.</Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {children}
        </Box>
      )}
    </Card>
  );
}

function Row({
  title,
  meta,
  detail,
  extra,
}: {
  title: string;
  meta: string;
  detail?: string;
  extra?: string;
}) {
  return (
    <Box component="li" sx={{ '& + &': { mt: 1.5 } }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
        <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {meta}
        </Typography>
      </Stack>
      {detail && (
        <Typography variant="body2" color="text.secondary">
          {detail}
        </Typography>
      )}
      {extra && (
        <Typography variant="body2" color="text.secondary">
          ☎ {extra}
        </Typography>
      )}
      <Divider sx={{ mt: 1.5 }} />
    </Box>
  );
}
