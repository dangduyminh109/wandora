'use client';
import { useEffect, useRef } from 'react';
import { api } from '@/lib/api-client';
export function PlaceViewTracker({ placeId }: { placeId: string }) {
  const recorded = useRef('');
  useEffect(() => {
    if (recorded.current === placeId) return;
    recorded.current = placeId;
    void api('/api/activity', {
      method: 'POST',
      body: JSON.stringify({ type: 'place_view', placeId }),
    }).catch(() => {
      /* Analytics failure must not block browsing. */
    });
  }, [placeId]);
  return null;
}
