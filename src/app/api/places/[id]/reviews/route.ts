import { NextResponse } from 'next/server';
import { assertSameOrigin, handleApi, parseJson } from '@/lib/http';
import { currentUser, requireUser } from '@/features/auth/server/session';
import { placeIdSchema } from '@/features/places/schemas';
import { reviewInputSchema, reviewsQuerySchema } from '@/features/places/review-schemas';
import {
  createOrUpdateReview,
  deleteReview,
  getUserReviewForPlace,
  listReviews,
} from '@/features/places/server/reviews';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  return handleApi(async () => {
    const id = placeIdSchema.parse((await context.params).id);
    const { searchParams } = new URL(request.url);
    const query = reviewsQuerySchema.parse({
      page: searchParams.get('page') ?? 0,
      pageSize: searchParams.get('pageSize') ?? 10,
    });
    const user = await currentUser();

    const [list, myReview] = await Promise.all([
      listReviews(id, query.page, query.pageSize),
      user ? getUserReviewForPlace(id, user.id) : null,
    ]);

    return NextResponse.json({
      reviews: list.reviews,
      total: list.total,
      myReview,
    });
  });
}

export async function POST(request: Request, context: Context) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    const id = placeIdSchema.parse((await context.params).id);
    const input = reviewInputSchema.parse(await parseJson(request));
    const review = await createOrUpdateReview(id, user, input);
    return NextResponse.json({ review });
  });
}

export async function DELETE(request: Request, context: Context) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    const id = placeIdSchema.parse((await context.params).id);
    await deleteReview(id, user.id);
    return NextResponse.json({ ok: true });
  });
}
