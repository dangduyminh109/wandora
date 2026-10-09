'use client';
import Link from 'next/link';
import { Box, Button, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { MagnifyingGlassIcon, PlusIcon } from '@phosphor-icons/react';
type Props = {
  title: string;
  description?: string;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  createLabel?: string;
  createHref?: string;
  onCreate?: () => void;
  actions?: React.ReactNode;
};
export function TableToolbar({
  title,
  description,
  search = '',
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm…',
  createLabel = 'Tạo mới',
  createHref,
  onCreate,
  actions,
}: Props) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      sx={{
        gap: 3,
        alignItems: { xs: 'stretch', md: 'center' },
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        p: 3,
      }}
    >
      <Box sx={{ minWidth: 0, flex: { md: '1 1 240px' } }}>
        <Typography variant="h4" component="h2">
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {description}
          </Typography>
        )}
      </Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{
          gap: 2,
          alignItems: { xs: 'stretch', sm: 'center' },
          flexWrap: 'wrap',
          flexShrink: 0,
          maxWidth: '100%',
        }}
      >
        {onSearchChange && (
          <TextField
            size="small"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            slotProps={{
              htmlInput: { 'aria-label': searchPlaceholder },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <MagnifyingGlassIcon size={20} aria-hidden="true" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: { xs: '100%', sm: 240 }, flexShrink: 0 }}
          />
        )}
        {actions && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexShrink: 0,
              width: { xs: '100%', sm: 'auto' },
              '& .MuiFormControl-root': { width: { xs: '100%', sm: 'auto' } },
            }}
          >
            {actions}
          </Box>
        )}
        {createHref ? (
          <Button
            component={Link}
            href={createHref}
            variant="contained"
            startIcon={<PlusIcon size={20} aria-hidden="true" />}
            sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {createLabel}
          </Button>
        ) : onCreate ? (
          <Button
            onClick={onCreate}
            variant="contained"
            startIcon={<PlusIcon size={20} aria-hidden="true" />}
            sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {createLabel}
          </Button>
        ) : null}
      </Stack>
    </Stack>
  );
}
