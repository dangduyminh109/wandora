'use client';
import { Chip, type ChipProps } from '@mui/material';
export function Badge({ label, color = 'default', ...props }: ChipProps) {
  return <Chip label={label} color={color} size="small" variant="outlined" {...props} />;
}
