'use client';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, MenuItem, Stack } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { FormTextField } from '@/components/forms/form-text-field';
import { SubmitButton } from '@/components/forms/submit-button';
import { api } from '@/lib/api-client';
import { placeCategories } from '../constants';
import {
  emptyPlaceForm,
  placeFormSchema,
  placeFormToInput,
  placeToForm,
  type PlaceFormValues,
} from '../form-schema';
import type { Place } from '../types';
import { useState } from 'react';
import { PlaceImagesField } from './place-images-field';

export function PlaceForm({ place }: { place?: Place }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PlaceFormValues>({
    resolver: zodResolver(placeFormSchema),
    defaultValues: place ? placeToForm(place) : emptyPlaceForm,
  });
  const knownCategory = placeCategories.some((item) => item.value === place?.category);
  return (
    <Box
      component="form"
      noValidate
      aria-busy={isSubmitting || uploading}
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        '& .full': { gridColumn: '1 / -1' }, // ô chiếm cả hai cột
      }}
      onSubmit={(event) => {
        if (uploading) {
          event.preventDefault();
          return;
        }
        return handleSubmit(async (data) => {
          try {
            const payload = JSON.stringify(placeFormToInput(data));
            if (place) {
              await api(`/api/places/${place.id}`, { method: 'PATCH', body: payload });
              toast.success('Đã cập nhật địa điểm.');
            } else {
              await api('/api/places', { method: 'POST', body: payload });
              toast.success('Đã thêm địa điểm.');
            }
            router.push('/admin/places');
            router.refresh();
          } catch (error) {
            setError('root', {
              message: error instanceof Error ? error.message : 'Không thể lưu địa điểm.',
            });
          }
        })(event);
      }}
    >
      <FormTextField
        control={control}
        name="name"
        label="Tên địa điểm"
        required
        slotProps={{ htmlInput: { maxLength: 120 } }}
      />
      <FormTextField control={control} name="category" label="Danh mục" select required>
        {placeCategories.map((item) => (
          <MenuItem key={item.value} value={item.value}>
            {item.label}
          </MenuItem>
        ))}
        {place && !knownCategory && <MenuItem value={place.category}>{place.category}</MenuItem>}
      </FormTextField>
      <FormTextField
        control={control}
        name="region"
        label="Khu vực (tỉnh/thành)"
        required
        slotProps={{ htmlInput: { maxLength: 80 } }}
      />
      <FormTextField
        control={control}
        name="address"
        label="Địa chỉ"
        slotProps={{ htmlInput: { maxLength: 200 } }}
      />
      <FormTextField
        control={control}
        name="latitude"
        label="Vĩ độ (latitude)"
        required
        helperText="Ví dụ: 16.0544"
        slotProps={{ htmlInput: { inputMode: 'decimal' } }}
      />
      <FormTextField
        control={control}
        name="longitude"
        label="Kinh độ (longitude)"
        required
        helperText="Ví dụ: 108.2478"
        slotProps={{ htmlInput: { inputMode: 'decimal' } }}
      />
      <FormTextField
        control={control}
        name="description"
        className="full"
        label="Mô tả"
        multiline
        minRows={4}
        slotProps={{ htmlInput: { maxLength: 5000 } }}
      />
      <FormTextField
        control={control}
        name="tags"
        className="full"
        label="Thẻ (tags)"
        helperText="Cách nhau bằng dấu phẩy, ví dụ: biển, check-in, gia đình"
      />
      <PlaceImagesField control={control} disabled={isSubmitting} onBusyChange={setUploading} />
      {errors.root && (
        <Alert severity="error" role="alert" className="full">
          {errors.root.message}
        </Alert>
      )}
      <Stack direction="row" spacing={2} className="full">
        <SubmitButton
          pending={isSubmitting || uploading}
          pendingLabel={uploading ? 'Đang tải ảnh…' : 'Đang lưu…'}
        >
          {place ? 'Lưu thay đổi' : 'Thêm địa điểm'}
        </SubmitButton>
        <Button onClick={() => router.push('/admin/places')} disabled={isSubmitting || uploading}>
          Hủy
        </Button>
      </Stack>
    </Box>
  );
}
