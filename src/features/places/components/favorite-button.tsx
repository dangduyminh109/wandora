'use client';
import { useEffect, useState } from 'react';
import { IconButton, Tooltip, type IconButtonProps } from '@mui/material';
import { HeartIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';

type Props = {
  placeId: string;
  initialFavorited?: boolean;
  size?: 'small' | 'medium';
  onToggle?: (favorited: boolean) => void;
  edge?: IconButtonProps['edge'];
  autoCheck?: boolean;
};

export function FavoriteButton({
  placeId,
  initialFavorited,
  size = 'medium',
  onToggle,
  edge,
  autoCheck = initialFavorited === undefined,
}: Props) {
  const [favorited, setFavorited] = useState(initialFavorited ?? false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!autoCheck) return;
    let active = true;
    api<{ favorited: boolean }>(`/api/places/${placeId}/favorite`)
      .then((data) => {
        if (active) setFavorited(data.favorited);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [placeId, autoCheck]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    setPending(true);
    const nextState = !favorited;
    setFavorited(nextState);

    try {
      const res = await api<{ favorited: boolean }>(`/api/places/${placeId}/favorite`, {
        method: 'POST',
      });
      setFavorited(res.favorited);
      onToggle?.(res.favorited);
      if (res.favorited) {
        toast.success('Đã thêm vào danh sách yêu thích');
      } else {
        toast.info('Đã xóa khỏi danh sách yêu thích');
      }
    } catch (err) {
      setFavorited(!nextState); // rollback
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật yêu thích');
    } finally {
      setPending(false);
    }
  };

  return (
    <Tooltip title={favorited ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}>
      <IconButton
        size={size}
        edge={edge}
        onClick={handleToggle}
        aria-label={favorited ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
        sx={{
          color: favorited ? 'error.main' : 'text.secondary',
          '&:hover': {
            color: 'error.main',
            backgroundColor: 'error.lighter',
          },
        }}
      >
        <HeartIcon size={size === 'small' ? 20 : 24} weight={favorited ? 'fill' : 'regular'} />
      </IconButton>
    </Tooltip>
  );
}
