'use client';
import { Box, Typography } from '@mui/material';
import { CompassIcon } from '@phosphor-icons/react';
export function EmptyState({
  title = 'Chưa có dữ liệu',
  description = 'Dữ liệu sẽ xuất hiện ở đây khi bạn tạo bản ghi đầu tiên.',
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Box sx={{ p: { xs: 3, md: 6 }, textAlign: 'center' }}>
      <CompassIcon size={40} aria-hidden="true" />
      <Typography variant="h4" component="h2" sx={{ mt: 2 }}>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: action ? 3 : 0 }}>
        {description}
      </Typography>
      {action}
    </Box>
  );
}
