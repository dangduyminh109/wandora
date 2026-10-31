'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
export function Brand({ href = '/', compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Box
      component={Link}
      href={href}
      aria-label="Wandora"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        color: 'inherit',
        textDecoration: 'none',
        flexShrink: 0,
      }}
    >
      <Image src="/brand/wandora-mark.svg" width={32} height={32} alt="" priority />
      {!compact && (
        <Typography component="span" variant="h3">
          Wandora
        </Typography>
      )}
    </Box>
  );
}
