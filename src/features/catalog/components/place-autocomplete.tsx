'use client';
import { useEffect, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { api } from '@/lib/api-client';
import type { Place } from '@/features/places/types';

export type PlaceOption = { id: string; name: string };

type Props = {
  value: PlaceOption | null;
  onChange: (value: PlaceOption | null) => void;
  label?: string;
  error?: string;
  required?: boolean;
  size?: 'small' | 'medium';
  disabled?: boolean;
};

// Ô chọn địa điểm có tìm kiếm theo tên (không cần gõ dấu), tải tối đa 20 kết quả mỗi lần gõ.
export function PlaceAutocomplete({
  value,
  onChange,
  label = 'Địa điểm',
  error,
  required,
  size,
  disabled,
}: Props) {
  const [input, setInput] = useState('');
  const debounced = useDebouncedValue(input);
  const [loaded, setLoaded] = useState<{ query: string; options: PlaceOption[] } | null>(null);
  const options = loaded?.options ?? [];
  const loading = loaded?.query !== debounced;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    api<{ places: Place[] }>(
      '/api/places?' +
        new URLSearchParams({
          pageSize: '20',
          sortBy: 'name',
          direction: 'asc',
          nameContains: debounced,
        }),
      { signal: controller.signal },
    )
      .then(
        (data) =>
          active &&
          setLoaded({
            query: debounced,
            options: data.places.map(({ id, name }) => ({ id, name })),
          }),
      )
      .catch(() => active && setLoaded({ query: debounced, options: [] }));
    return () => {
      active = false;
      controller.abort();
    };
  }, [debounced]);

  return (
    <Autocomplete
      size={size}
      fullWidth
      // Toolbar đặt width:auto cho mọi FormControl; ép về 100% để ô và danh sách thả xuống không bị co lại.
      sx={{ '&& .MuiFormControl-root': { width: '100%' } }}
      slotProps={{ popper: { sx: { minWidth: 280 } } }}
      disabled={disabled}
      options={options}
      value={value}
      loading={loading}
      filterOptions={(items) => items} // máy chủ đã lọc
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      onChange={(_, next) => onChange(next)}
      onInputChange={(_, next, reason) => reason !== 'reset' && setInput(next)}
      noOptionsText="Không có địa điểm phù hợp"
      loadingText="Đang tìm…"
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={Boolean(error)}
          helperText={error}
        />
      )}
    />
  );
}
