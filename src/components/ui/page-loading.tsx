'use client';
import { Box, Skeleton, Stack } from '@mui/material';
export function PageLoading() {
  return (
    <Stack spacing={3} aria-busy="true" aria-label="Đang tải trang">
      <Skeleton variant="text" width="40%" height={48} />
      <Skeleton variant="text" width="65%" />
      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          p: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Skeleton variant="rounded" height={48} sx={{ mb: 3 }} />
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} height={48} />
        ))}
      </Box>
    </Stack>
  );
}
