import { notFound } from 'next/navigation';
import { HttpError } from '@/lib/http';
import { PlaceFormView } from '@/features/places/components/place-form-view';
import { placeIdSchema } from '@/features/places/schemas';
import { getPlace } from '@/features/places/server/places';
import type { Place } from '@/features/places/types';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = placeIdSchema.safeParse((await params).id);
  if (!id.success) notFound();
  let place: Place;
  try {
    place = await getPlace(id.data);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  }
  return <PlaceFormView place={place} />;
}
