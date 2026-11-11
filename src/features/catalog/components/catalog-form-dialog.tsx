'use client';
import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormTextField } from '@/components/forms/form-text-field';
import { SubmitButton } from '@/components/forms/submit-button';
import { api } from '@/lib/api-client';
import {
  emptyForm,
  itemToForm,
  validateForm,
  type CatalogConfig,
  type FormValues,
} from '../form-config';
import { PlaceAutocomplete, type PlaceOption } from './place-autocomplete';
import { ImageAlbumField } from '@/features/places/components/place-images-field';

export type EditableItem = { id: string; placeId: string } & Record<string, unknown>;

type Props = {
  config: CatalogConfig;
  item: EditableItem | null; // null = thêm mới
  placeNames: Record<string, string>;
  defaultPlace: PlaceOption | null; // địa điểm đang lọc, dùng làm giá trị mặc định khi thêm
  onClose: () => void;
  onSaved: () => void;
};

export function CatalogFormDialog({
  config,
  item,
  placeNames,
  defaultPlace,
  onClose,
  onSaved,
}: Props) {
  // Hộp thoại được gắn vào khi mở và gỡ khi đóng, nên giá trị ban đầu chỉ cần tính một lần.
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: item ? itemToForm(config, item) : emptyForm(config),
  });
  const [place, setPlace] = useState<PlaceOption | null>(
    item
      ? { id: item.placeId, name: placeNames[item.placeId] ?? 'Địa điểm đã chọn' }
      : defaultPlace,
  );
  const [placeError, setPlaceError] = useState('');
  const [uploading, setUploading] = useState(false);

  return (
    <Dialog open onClose={isSubmitting || uploading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{item ? `Sửa ${config.singular}` : `Thêm ${config.singular}`}</DialogTitle>
      <form
        noValidate
        aria-busy={isSubmitting || uploading}
        onSubmit={handleSubmit(async (values) => {
          if (uploading) return;
          const result = validateForm(config, place?.id ?? null, values);
          if (!result.ok) {
            setPlaceError(result.errors.placeId ?? '');
            for (const [name, message] of Object.entries(result.errors)) {
              if (name !== 'placeId') setError(name, { message });
            }
            return;
          }
          try {
            const body = JSON.stringify(result.data);
            if (item) {
              await api(`${config.endpoint}/${item.id}`, { method: 'PATCH', body });
              toast.success(`Đã cập nhật ${config.singular}.`);
            } else {
              await api(config.endpoint, { method: 'POST', body });
              toast.success(`Đã thêm ${config.singular}.`);
            }
            onSaved();
          } catch (error) {
            setError('root', {
              message: error instanceof Error ? error.message : 'Không thể lưu dữ liệu.',
            });
          }
        })}
      >
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <PlaceAutocomplete
              value={place}
              onChange={(next) => {
                setPlace(next);
                setPlaceError('');
              }}
              required
              error={placeError}
            />
            {config.fields.map((field) =>
              field.kind === 'images' ? (
                <ImageAlbumField
                  key={field.name}
                  control={control}
                  name={field.name}
                  label={`Ảnh ${config.singular}`}
                  disabled={isSubmitting}
                  onBusyChange={setUploading}
                />
              ) : (
                <FormTextField
                  key={field.name}
                  control={control}
                  name={field.name}
                  label={field.label}
                  required={field.required}
                  select={field.kind === 'select'}
                  multiline={field.kind === 'multiline'}
                  minRows={field.kind === 'multiline' ? 3 : undefined}
                  helperText={field.helper}
                  slotProps={{ htmlInput: { maxLength: field.maxLength } }}
                >
                  {field.options?.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </FormTextField>
              ),
            )}
            {errors.root && (
              <Alert severity="error" role="alert">
                {errors.root.message}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={onClose} disabled={isSubmitting || uploading}>
            Hủy
          </Button>
          <SubmitButton pending={isSubmitting || uploading}>
            {item ? 'Lưu thay đổi' : `Thêm ${config.singular}`}
          </SubmitButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
