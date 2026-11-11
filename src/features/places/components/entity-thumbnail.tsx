'use client';
import { useState } from 'react';
import { Box } from '@mui/material';
import { isImageSource } from '../image-policy';

export function EntityThumbnail({ images, name }: { images?: string[]; name: string }) {
  const [failed, setFailed] = useState('');
  const source = images?.[0];
  return (
    <Box
      component="img"
      src={
        source && isImageSource(source) && source !== failed
          ? source
          : '/images/place-placeholder.svg'
      }
      alt={name}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => {
        if (source) setFailed(source);
      }}
      sx={{
        width: 88,
        height: 64,
        objectFit: 'cover',
        borderRadius: 1,
        bgcolor: 'background.default',
        display: 'block',
        flexShrink: 0,
      }}
    />
  );
}
