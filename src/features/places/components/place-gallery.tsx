'use client';
import { useState } from 'react';
import { Box, ButtonBase, IconButton, Stack } from '@mui/material';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';

export function PlaceGallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(0);
  const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set());

  if (!images || images.length === 0) {
    return (
      <Box
        sx={{
          width: '100%',
          aspectRatio: { xs: '16 / 10', md: '21 / 9' },
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: 'background.default',
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          component="img"
          src="/images/place-placeholder.svg"
          alt={name}
          sx={{ maxWidth: 200, opacity: 0.6 }}
        />
      </Box>
    );
  }

  const currentImage = failedIndices.has(selected)
    ? '/images/place-placeholder.svg'
    : (images[selected] ?? images[0]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <Stack spacing={1.5} aria-label={`Bộ sưu tập ảnh ${name}`}>
      {/* Main hero image */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: { xs: '16 / 10', md: '16 / 9' },
          maxHeight: 520,
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: 'grey.900',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          component="img"
          src={currentImage}
          alt={`${name} — ảnh ${selected + 1}`}
          referrerPolicy="no-referrer"
          onError={() => {
            setFailedIndices((prev) => new Set(prev).add(selected));
          }}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'opacity 0.25s ease-in-out',
          }}
        />

        {/* Floating count pill */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 14,
            right: 14,
            bgcolor: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            fontSize: '0.8125rem',
            fontWeight: 500,
            letterSpacing: '0.02em',
            pointerEvents: 'none',
          }}
        >
          {selected + 1} / {images.length}
        </Box>

        {/* Prev / Next controls if multiple photos */}
        {images.length > 1 && (
          <>
            <IconButton
              onClick={handlePrev}
              aria-label="Ảnh trước"
              sx={{
                position: 'absolute',
                top: '50%',
                left: 12,
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(4px)',
                color: 'grey.900',
                boxShadow: 2,
                '&:hover': { bgcolor: '#fff' },
                width: 38,
                height: 38,
              }}
            >
              <CaretLeftIcon size={20} weight="bold" />
            </IconButton>

            <IconButton
              onClick={handleNext}
              aria-label="Ảnh kế tiếp"
              sx={{
                position: 'absolute',
                top: '50%',
                right: 12,
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(4px)',
                color: 'grey.900',
                boxShadow: 2,
                '&:hover': { bgcolor: '#fff' },
                width: 38,
                height: 38,
              }}
            >
              <CaretRightIcon size={20} weight="bold" />
            </IconButton>
          </>
        )}
      </Box>

      {/* Thumbnails strip */}
      {images.length > 1 && (
        <Stack
          direction="row"
          spacing={1.25}
          sx={{
            overflowX: 'auto',
            py: 0.5,
            px: 0.25,
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'divider',
              borderRadius: 3,
            },
          }}
        >
          {images.map((src, i) => {
            const isFailed = failedIndices.has(i);
            const isSel = selected === i;
            return (
              <ButtonBase
                key={`${src}-${i}`}
                onClick={() => setSelected(i)}
                aria-label={`Xem ảnh ${i + 1} của ${name}`}
                aria-pressed={isSel}
                sx={{
                  flexShrink: 0,
                  p: 0.35,
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: isSel ? 'primary.main' : 'transparent',
                  opacity: isSel ? 1 : 0.65,
                  transition: 'all 0.2s ease',
                  '&:hover': { opacity: 1 },
                }}
              >
                <Box
                  component="img"
                  src={isFailed ? '/images/place-placeholder.svg' : src}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => {
                    setFailedIndices((prev) => new Set(prev).add(i));
                  }}
                  sx={{
                    width: { xs: 72, sm: 84 },
                    height: { xs: 48, sm: 56 },
                    objectFit: 'cover',
                    borderRadius: 1.5,
                    display: 'block',
                  }}
                />
              </ButtonBase>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
