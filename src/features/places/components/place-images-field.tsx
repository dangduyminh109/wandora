'use client';
import { useRef, useState } from 'react';
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormHelperText,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { ArrowLeftIcon, ArrowRightIcon, TrashIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import { refreshSession } from '@/lib/api-client';
import {
  IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  MAX_PLACE_IMAGES,
  imageSourceSchema,
  splitImageSources,
} from '../image-policy';
import type { PlaceFormValues } from '../form-schema';

async function upload(file: File) {
  const form = new FormData();
  form.append('file', file);
  const send = () => fetch('/api/uploads', { method: 'POST', body: form });
  let response = await send();
  if (response.status === 401 && (await refreshSession()).ok) response = await send();
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? 'Không tải được ảnh.');
  return body.url as string;
}

export function PlaceImagesField({
  control,
  disabled,
  onBusyChange,
}: {
  control: Control<PlaceFormValues>;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  return (
    <ImageAlbumField
      control={control}
      name="images"
      disabled={disabled}
      onBusyChange={onBusyChange}
    />
  );
}

export function ImageAlbumField<T extends FieldValues>({
  control,
  name,
  label = 'Ảnh địa điểm',
  disabled,
  onBusyChange,
}: {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const { field, fieldState } = useController({ name, control });
  const images = splitImageSources(String(field.value ?? ''));
  const input = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  const blocked = disabled || busy;
  const change = (next: string[]) => {
    field.onChange(next.join('\n'));
    field.onBlur();
  };
  const move = (index: number, target: number) => {
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    change(next);
  };
  const selectFiles = async (files: File[]) => {
    if (lock.current || disabled || !files.length) return;
    setError('');
    if (images.length + files.length > MAX_PLACE_IMAGES) {
      setError(
        `Mỗi mục tối đa ${MAX_PLACE_IMAGES} ảnh. Bạn còn có thể thêm ${MAX_PLACE_IMAGES - images.length} ảnh.`,
      );
      return;
    }
    const invalid = files.find(
      (file) =>
        !file.size ||
        file.size > MAX_IMAGE_BYTES ||
        !(IMAGE_MIME_TYPES as readonly string[]).includes(file.type),
    );
    if (invalid) {
      setError(`${invalid.name}: cần là JPG, PNG hoặc WebP, không trống và tối đa 5 MB.`);
      return;
    }
    lock.current = true;
    setBusy(true);
    onBusyChange(true);
    const next = [...images];
    try {
      for (let i = 0; i < files.length; i++) {
        setProgress(`Đang tải ảnh ${i + 1}/${files.length}…`);
        next.push(await upload(files[i]));
        change([...next]);
      }
    } catch (e) {
      setError(
        `${e instanceof Error ? e.message : 'Không tải được ảnh.'} Các ảnh đã tải thành công vẫn được giữ trong danh sách.`,
      );
    } finally {
      lock.current = false;
      setBusy(false);
      onBusyChange(false);
      setProgress('');
    }
  };
  return (
    <Stack className="full" spacing={2} aria-label={label} aria-busy={busy}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Typography component="h2" variant="h4">
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {images.length}/{MAX_PLACE_IMAGES} ảnh
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" id="place-image-help">
        JPG, PNG hoặc WebP, tối đa 5 MB mỗi ảnh. Ảnh đầu tiên là ảnh bìa. Bấm lưu để áp dụng thay
        đổi album.
      </Typography>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        disabled={blocked}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = '';
          void selectFiles(files);
        }}
      />
      <Button
        type="button"
        variant="outlined"
        startIcon={<UploadSimpleIcon aria-hidden="true" />}
        disabled={blocked || images.length >= MAX_PLACE_IMAGES}
        onClick={() => input.current?.click()}
        sx={{ alignSelf: 'flex-start' }}
        aria-describedby="place-image-help"
      >
        Chọn ảnh từ máy
      </Button>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Thêm bằng URL ảnh"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={blocked}
          fullWidth
          size="small"
          type="url"
          slotProps={{ htmlInput: { maxLength: 2048 } }}
        />
        <Button
          type="button"
          variant="outlined"
          disabled={blocked || !url.trim() || images.length >= MAX_PLACE_IMAGES}
          sx={{ flexShrink: 0 }}
          onClick={() => {
            const result = imageSourceSchema.safeParse(url.trim());
            if (!result.success) {
              setError(result.error.issues[0].message);
              return;
            }
            if (images.includes(result.data)) {
              setError('Ảnh này đã có trong danh sách.');
              return;
            }
            change([...images, result.data]);
            setUrl('');
            setError('');
          }}
        >
          Thêm URL
        </Button>
      </Stack>
      {busy && (
        <Box role="status">
          <Typography variant="body2" sx={{ mb: 1 }}>
            {progress}
          </Typography>
          <LinearProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" role="alert">
          {error}
        </Alert>
      )}
      {fieldState.error && (
        <FormHelperText error role="alert">
          {fieldState.error.message}
        </FormHelperText>
      )}
      {!images.length && (
        <Typography color="text.secondary" variant="body2">
          Chưa có ảnh. Chọn ảnh từ máy hoặc thêm một URL để bắt đầu.
        </Typography>
      )}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
          },
        }}
      >
        {images.map((source, index) => (
          <Box
            key={`${source}-${index}`}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <Box
              component="img"
              src={source}
              alt={`${label} ${index + 1}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              sx={{
                display: 'block',
                width: '100%',
                aspectRatio: '4 / 3',
                objectFit: 'cover',
                bgcolor: 'background.default',
              }}
            />
            <Stack spacing={1} sx={{ p: 1.5 }}>
              {index === 0 ? (
                <Chip
                  size="small"
                  color="primary"
                  label="Ảnh bìa"
                  sx={{ alignSelf: 'flex-start' }}
                />
              ) : (
                <Button
                  type="button"
                  size="small"
                  disabled={blocked}
                  onClick={() => move(index, 0)}
                >
                  Đặt làm ảnh bìa
                </Button>
              )}
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Tooltip title="Đưa lên trước">
                  <span>
                    <IconButton
                      type="button"
                      aria-label={`Đưa ảnh ${index + 1} lên trước`}
                      disabled={blocked || index === 0}
                      onClick={() => move(index, index - 1)}
                      sx={{ minWidth: 44, minHeight: 44 }}
                    >
                      <ArrowLeftIcon size={20} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Đưa ra sau">
                  <span>
                    <IconButton
                      type="button"
                      aria-label={`Đưa ảnh ${index + 1} ra sau`}
                      disabled={blocked || index === images.length - 1}
                      onClick={() => move(index, index + 1)}
                      sx={{ minWidth: 44, minHeight: 44 }}
                    >
                      <ArrowRightIcon size={20} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Gỡ khỏi album">
                  <span>
                    <IconButton
                      type="button"
                      color="error"
                      aria-label={`Gỡ ảnh ${index + 1} khỏi album`}
                      disabled={blocked}
                      onClick={() => change(images.filter((_, i) => i !== index))}
                      sx={{ minWidth: 44, minHeight: 44 }}
                    >
                      <TrashIcon size={20} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>
        ))}
      </Box>
    </Stack>
  );
}
