'use client';
import { useState, type ComponentProps } from 'react';
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
import { categoryLabel } from '../constants';
import { isImageSource } from '../image-policy';
import type { Place } from '../types';
import { FavoriteButton } from './favorite-button';

export type PlaceCardData = Pick<
  Place,
  'id' | 'slug' | 'name' | 'category' | 'region' | 'description' | 'ratingAvg' | 'ratingCount'
> & { images?: string[]; tags?: string[] };

export function PlaceGrid({ children, sx }: { children: React.ReactNode; sx?: object }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(3, minmax(0, 1fr))',
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function PlaceCover({ source, name }: { source?: string; name: string }) {
  const [failedSource, setFailedSource] = useState('');
  const hasPhoto = Boolean(source && isImageSource(source) && source !== failedSource);
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 10',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <Box
        component="img"
        src={hasPhoto ? source : '/images/place-placeholder.svg'}
        alt={hasPhoto ? name : `Ảnh minh họa cho ${name}`}
        onError={() => {
          if (source) setFailedSource(source);
        }}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {!hasPhoto && (
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            bgcolor: 'background.paper',
            color: 'text.secondary',
            px: 1,
            py: 0.5,
            borderRadius: 1,
          }}
        >
          Chưa có ảnh
        </Typography>
      )}
    </Box>
  );
}

export function PlaceCard({
  place,
  footer,
  compact = false,
  showFavorite = true,
  favoriteProps,
  showTags = false,
}: {
  place: PlaceCardData;
  footer?: React.ReactNode;
  compact?: boolean;
  showFavorite?: boolean;
  favoriteProps?: Pick<ComponentProps<typeof FavoriteButton>, 'initialFavorited' | 'onToggle'>;
  showTags?: boolean;
}) {
  return (
    <MuiCard
      component="article"
      variant="outlined"
      sx={{
        position: 'relative',
        minWidth: 0,
        height: '100%',
        display: 'flex',
        borderRadius: 2,
        overflow: 'hidden',
        borderColor: 'divider',
        transition:
          'box-shadow 200ms cubic-bezier(.32,.72,0,1), border-color 200ms cubic-bezier(.32,.72,0,1)',
        '&:hover': { borderColor: 'primary.main', boxShadow: '0 8px 24px rgba(7,89,133,0.10)' },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}
    >
      {showFavorite && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 2,
            bgcolor: 'background.paper',
            borderRadius: '50%',
            boxShadow: '0 2px 8px rgba(22,48,71,0.12)',
            '& button': { width: 44, height: 44 },
          }}
        >
          <FavoriteButton placeId={place.id} {...favoriteProps} />
        </Box>
      )}
      <CardActionArea
        component={Link}
        href={`/explore/${place.slug}`}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          height: '100%',
          '&.Mui-focusVisible': {
            outline: '3px solid',
            outlineColor: 'primary.main',
            outlineOffset: -3,
          },
        }}
      >
        <PlaceCover source={place.images?.[0]} name={place.name} />
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            gap: 1.5,
            p: compact ? 2 : 3,
            '&:last-child': { pb: compact ? 2 : 3 },
          }}
        >
          <Typography
            component="span"
            variant="caption"
            sx={{ color: 'primary.main', fontWeight: 600 }}
          >
            {categoryLabel(place.category)}
          </Typography>
          <Typography
            component="h2"
            sx={{
              fontSize: compact ? '1.125rem' : '1.25rem',
              lineHeight: '1.75rem',
              fontWeight: 600,
              color: 'text.primary',
              textWrap: 'balance',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {place.name}
          </Typography>
          <Stack
            direction="row"
            sx={{ alignItems: 'center', gap: 0.75, color: 'text.secondary', minWidth: 0 }}
          >
            <MapPinIcon size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
            <Typography variant="body2" noWrap>
              {place.region}
            </Typography>
          </Stack>
          {!compact && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                minHeight: '2.5rem',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textWrap: 'pretty',
              }}
            >
              {place.description || 'Khám phá thông tin và trải nghiệm tại điểm đến này.'}
            </Typography>
          )}
          <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75, mt: 'auto', pt: 0.5 }}>
            <StarIcon size={16} weight="fill" color="#9a6700" aria-hidden="true" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {place.ratingCount > 0 ? place.ratingAvg.toFixed(1) : 'Mới'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {place.ratingCount > 0 ? `(${place.ratingCount} đánh giá)` : 'Chưa có đánh giá'}
            </Typography>
          </Stack>
          {showTags && Boolean(place.tags?.length) && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {place
                .tags!.slice(0, 3)
                .map((tag) => `#${tag}`)
                .join('  ')}
            </Typography>
          )}
          {footer}
        </CardContent>
      </CardActionArea>
    </MuiCard>
  );
}
