import type { Metadata } from 'next';
import { FavoritesView } from '@/features/places/components/favorites-view';

export const metadata: Metadata = {
  title: 'Địa điểm yêu thích | Wandora',
  description: 'Danh sách các điểm đến bạn đã lưu lại.',
};

export default function FavoritesPage() {
  return <FavoritesView />;
}
