'use client';
import Link from 'next/link';
import {
  Box,
  Card as MuiCard,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import { MapPinIcon, StarIcon } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { categoryLabel } from '../constants';
import type { Place } from '../types';
import { FavoriteButton } from './favorite-button';

export function PlaceGrid({ children, sx }: { children: React.ReactNode; sx?: object }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

// `footer` hiển thị dưới mô tả (ví dụ danh sách tiện ích khớp khi tìm theo tiện ích).
export function PlaceCard({ place, footer }: { place: Place; footer?: React.ReactNode }) {
  return (
    <MuiCard variant="outlined" sx={{ position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 18, right: 18, zIndex: 2 }}>
        <FavoriteButton placeId={place.id} size="small" />
      </Box>
      <CardActionArea component={Link} href={`/explore/${place.slug}`} sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1, pr: 4.5 }}
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
          {footer}
        </CardContent>
      </CardActionArea>
    </MuiCard>
  );
}
