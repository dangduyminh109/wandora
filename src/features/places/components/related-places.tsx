'use client';
import { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { PlaceCard } from './place-card';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api-client';
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
            <PlaceCard key={place.id} place={place} compact />
          ))}
        </Box>
      )}
    </Card>
  );
}
