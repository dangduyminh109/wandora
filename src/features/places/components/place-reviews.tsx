'use client';
import { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Rating,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { TrashIcon, StarIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api-client';
import type { Review } from '../server/reviews';

type Props = {
  placeId: string;
  ratingAvg: number;
  ratingCount: number;
};

export function PlaceReviews({ placeId, ratingAvg, ratingCount }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reload, setReload] = useState(0);

  // Form state
  const [rating, setRating] = useState<number | null>(5);
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    let active = true;
    api<{ reviews: Review[]; total: number; myReview: Review | null }>(
      `/api/places/${placeId}/reviews`,
    )
      .then((data) => {
        if (!active) return;
        setReviews(data.reviews);
        setMyReview(data.myReview);
        if (data.myReview) {
          setRating(data.myReview.rating);
          setComment(data.myReview.comment);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [placeId, reload]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      toast.error('Vui lòng chọn số sao đánh giá');
      return;
    }
    setSubmitting(true);
    try {
      await api(`/api/places/${placeId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment }),
      });
      toast.success(myReview ? 'Đã cập nhật đánh giá' : 'Đã gửi đánh giá thành công!');
      setIsEditing(false);
      setReload((v) => v + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa đánh giá của mình?')) return;
    setSubmitting(true);
    try {
      await api(`/api/places/${placeId}/reviews`, { method: 'DELETE' });
      toast.success('Đã xóa đánh giá');
      setMyReview(null);
      setRating(5);
      setComment('');
      setIsEditing(false);
      setReload((v) => v + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      title="Đánh giá từ cộng đồng"
      description={
        ratingCount > 0
          ? `Điểm trung bình: ${ratingAvg.toFixed(1)} / 5 ★ (${ratingCount} lượt đánh giá)`
          : 'Chưa có đánh giá nào cho địa điểm này.'
      }
    >
      <Stack spacing={3}>
        {/* Form viết đánh giá */}
        {myReview && !isEditing ? (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Đánh giá của bạn
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={() => setIsEditing(true)}>
                  Chỉnh sửa
                </Button>
                <Button size="small" color="error" startIcon={<TrashIcon />} onClick={handleDelete}>
                  Xóa
                </Button>
              </Stack>
            </Stack>
            <Rating value={myReview.rating} readOnly size="small" sx={{ mb: 1 }} />
            <Typography variant="body2">{myReview.comment || 'Không có bình luận.'}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              {new Date(myReview.updatedAt).toLocaleDateString('vi-VN')}
            </Typography>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              {myReview ? 'Chỉnh sửa đánh giá của bạn' : 'Chia sẻ trải nghiệm của bạn'}
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Mức độ hài lòng:
                </Typography>
                <Rating
                  value={rating}
                  onChange={(_, val) => setRating(val)}
                  size="medium"
                  emptyIcon={<StarIcon size={24} />}
                />
              </Stack>
              <TextField
                multiline
                rows={3}
                placeholder="Viết cảm nhận của bạn về địa điểm này (cảnh quan, dịch vụ, lưu ý khi tham quan...)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                fullWidth
              />
              <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                {isEditing && (
                  <Button variant="outlined" onClick={() => setIsEditing(false)}>
                    Hủy
                  </Button>
                )}
                <Button type="submit" variant="contained" disabled={submitting}>
                  {submitting ? 'Đang gửi...' : myReview ? 'Cập nhật' : 'Gửi đánh giá'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}

        <Divider />

        {/* Danh sách các đánh giá khác */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : reviews.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            Hãy là người đầu tiên để lại đánh giá cho địa điểm này!
          </Typography>
        ) : (
          <Stack spacing={2}>
            {reviews.map((rev) => (
              <Box key={rev.id} sx={{ '& + &': { borderTop: '1px solid', borderColor: 'divider', pt: 2 } }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: 'primary.main' }}>
                    {rev.userName ? rev.userName[0].toUpperCase() : 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {rev.userName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 'auto' }}>
                    <Rating value={rev.rating} readOnly size="small" />
                  </Box>
                </Stack>
                {rev.comment && (
                  <Typography variant="body2" sx={{ pl: 5.5, whiteSpace: 'pre-line' }}>
                    {rev.comment}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
