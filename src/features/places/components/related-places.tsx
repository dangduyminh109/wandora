'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Card as MuiCard,
  CardActionArea,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { MapPinIcon, StarIcon } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api-client';
import { categoryLabel } from '../constants';
import type { Place } from '../types';

export function RelatedPlaces({ placeId }: { placeId: string }) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ places: Place[] }>(`/api/places/${placeId}/related?limit=4`)
      .then((data) => setPlaces(data.places))
      .catch(() => setPlaces([]))
      .finally(() => setLoading(false));
  }, [placeId]);

  if (!loading && places.length === 0) return null;

  return (
    <Card
      title="Địa điểm tương tự bạn có thể thích"
      description="Gợi ý cùng danh mục và khu vực từ đồ thị"
    >
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
            gap: 2,
          }}
        >
          {places.map((place) => (
            <MuiCard
              key={place.id}
              variant="outlined"
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2,
                },
              }}
            >
              <CardActionArea
                component={Link}
                href={`/explore/${place.slug}`}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
                  >
                    <Badge label={categoryLabel(place.category)} color="primary" />
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <StarIcon size={14} weight="fill" color="#eab308" />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {place.ratingAvg ? place.ratingAvg.toFixed(1) : 'Mới'}
                      </Typography>
                    </Stack>
                  </Stack>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {place.name}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{ alignItems: 'center', color: 'text.secondary' }}
                  >
                    <MapPinIcon size={14} />
                    <Typography variant="caption" noWrap>
                      {place.region}
                    </Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </MuiCard>
          ))}
        </Box>
      )}
    </Card>
  );
}
