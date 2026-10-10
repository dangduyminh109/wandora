import { notFound } from 'next/navigation';
import { HttpError } from '@/lib/http';
import { PlaceDetailView } from '@/features/places/components/place-detail-view';
import { placeSlugSchema } from '@/features/places/schemas';
import { getPlaceDetail } from '@/features/places/server/detail';

type Detail = Awaited<ReturnType<typeof getPlaceDetail>>['value'];

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const slug = placeSlugSchema.safeParse((await params).slug);
  if (!slug.success) notFound();
  let detail: Detail;
  try {
    detail = (await getPlaceDetail(slug.data)).value;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  }
  return <PlaceDetailView {...detail} />;
}
