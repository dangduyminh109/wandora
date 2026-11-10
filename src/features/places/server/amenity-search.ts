import 'server-only';
import type { Filter } from 'mongodb';
import { ObjectId } from 'mongodb';
import type { z } from 'zod';
import { cache, CACHE_TTL_SECONDS } from '@/lib/cache';
import { getMongo } from '@/lib/db/mongodb';
import { matchAmenities, type AmenityMatch } from '../amenities';
import type { amenitySearchQuerySchema } from '../schemas';
import type { Place } from '../types';
import { findSimilarCandidates } from './amenity-graph';
import { toPlace, type PlaceDoc } from './places';

export type AmenitySearchResult = {
  places: (Place & { match: AmenityMatch })[];
  total: number;
  fullCount: number;
  partialCount: number;
  similarCount: number;
  // false khi Neo4j không dùng được: kết quả chỉ gồm địa điểm khớp đúng, không có gợi ý gần giống.
  similarAvailable: boolean;
};

type AmenityQuery = z.output<typeof amenitySearchQuerySchema>;
type Similarity = Record<string, Record<string, { via: string; weight: number }>>;

// Địa điểm có tiện ích khớp đúng (từ MongoDB) hoặc tiện ích gần giống (từ đồ thị Neo4j), xếp theo điểm.
// Chấm điểm và phân trang làm trong bộ nhớ vì phải trộn hai nguồn.
export async function findPlacesByAmenities(query: AmenityQuery): Promise<AmenitySearchResult> {
  // Fail-open giống cache: Neo4j lỗi thì vẫn trả kết quả khớp đúng thay vì làm hỏng yêu cầu.
  let similarity: Similarity = {};
  let similarAvailable = true;
  try {
    for (const item of await findSimilarCandidates(query.amenities)) {
      (similarity[item.placeId] ??= {})[item.wanted] = { via: item.via, weight: item.weight };
    }
  } catch (error) {
    console.error('Neo4j unavailable, amenity search without similar matches:', error);
    similarity = {};
    similarAvailable = false;
  }

  const similarIds = Object.keys(similarity).map((id) => new ObjectId(id));
  const filter: Filter<PlaceDoc> = {
    $or: [{ amenities: { $in: query.amenities } }, { _id: { $in: similarIds } }],
  };
  if (query.category) filter.category = query.category;
  if (query.region) filter.region = query.region;
  if (query.minRating > 0) filter.ratingAvg = { $gte: query.minRating };

  const docs = await (await getMongo()).collection<PlaceDoc>('places').find(filter).toArray();
  const ranked = docs
    .map((doc) => {
      const place = toPlace(doc);
      return {
        ...place,
        match: matchAmenities(
          query.amenities,
          place.amenities,
          place.ratingAvg,
          similarity[place.id],
        ),
      };
    })
    .sort((a, b) => b.match.score - a.match.score || a.id.localeCompare(b.id));

  const count = (type: AmenityMatch['type']) =>
    ranked.filter((place) => place.match.type === type).length;
  const start = query.page * query.pageSize;
  return {
    places: ranked.slice(start, start + query.pageSize),
    total: ranked.length,
    fullCount: count('full'),
    partialCount: count('partial'),
    similarCount: count('similar'),
    similarAvailable,
  };
}

class DegradedResult extends Error {
  constructor(readonly value: AmenitySearchResult) {
    super('degraded amenity search result');
  }
}

export async function searchPlacesByAmenities(query: AmenityQuery) {
  try {
    return await cache.cached(
      cache.keyOf('places:amenity-search', query),
      CACHE_TTL_SECONDS,
      async () => {
        const result = await findPlacesByAmenities(query);
        // Không cache kết quả thiếu gợi ý gần giống, nếu không Neo4j hồi phục rồi vẫn trả bản thiếu.
        if (!result.similarAvailable) throw new DegradedResult(result);
        return result;
      },
    );
  } catch (error) {
    if (error instanceof DegradedResult) return { value: error.value, hit: false };
    throw error;
  }
}
