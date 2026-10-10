import 'server-only';
import { cache, CACHE_TTL_SECONDS } from '@/lib/cache';
import { catalogQuerySchema } from '@/features/catalog/schemas';
import {
  hotelRepository,
  restaurantRepository,
  serviceRepository,
} from '@/features/catalog/server/registry';
import { getPlaceBySlug } from './places';

async function loadPlaceDetail(slug: string) {
  const place = await getPlaceBySlug(slug); // ném 404 nếu không có (kết quả lỗi không được cache)
  const query = catalogQuerySchema.parse({
    placeId: place.id,
    pageSize: 50,
    sortBy: 'priceLevel',
    direction: 'asc',
  });
  const [hotels, restaurants, services] = await Promise.all([
    hotelRepository.list(query),
    restaurantRepository.list(query),
    serviceRepository.list(query),
  ]);
  return { place, hotels: hotels.items, restaurants: restaurants.items, services: services.items };
}

// Chi tiết địa điểm + khách sạn/nhà hàng/dịch vụ, cache chung một khóa theo slug.
export async function getPlaceDetail(slug: string, options: { useCache?: boolean } = {}) {
  if (options.useCache === false) return { value: await loadPlaceDetail(slug), hit: false };
  return cache.cached(`place:detail:${slug}`, CACHE_TTL_SECONDS, () => loadPlaceDetail(slug));
}
