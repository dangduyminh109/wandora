import 'server-only';
import { ObjectId } from 'mongodb';
import { getMongo } from '@/lib/db/mongodb';
import { toPlace, type PlaceDoc } from '@/features/places/server/places';
import type { Activity } from '../schemas';
import { activityDays } from '../summary';
import { recentPlaceViews } from '../recent';
import { readHistory } from './activity';

export async function recentlyViewedPlaces(userId: string) {
  const events: Activity[] = [];
  let truncated = false;
  for (const day of activityDays(30)) {
    const history = await readHistory(userId, { day, limit: 1000 });
    events.push(...history.events);
    // Stop before older days if the current day's scan was capped.
    if (history.next) {
      truncated = true;
      break;
    }
    if (recentPlaceViews(events).length >= 48) break;
  }
  const visits = recentPlaceViews(events).slice(0, 48);
  const documents = visits.length
    ? await (
        await getMongo()
      )
        .collection<PlaceDoc>('places')
        .find({ _id: { $in: visits.map((event) => new ObjectId(event.placeId)) } })
        .toArray()
    : [];
  const places = new Map(documents.map((doc) => [doc._id.toHexString(), toPlace(doc)]));
  return {
    items: visits
      .flatMap((event) => {
        const place = places.get(event.placeId);
        return place ? [{ place, viewedAt: event.occurredAt }] : [];
      })
      .slice(0, 24),
    truncated,
  };
}
