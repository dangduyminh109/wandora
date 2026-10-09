import { NextResponse } from 'next/server';
import { handleApi } from '@/lib/http';
import { requireUser } from '@/features/auth/server/session';
export async function GET() {
  return handleApi(async () => NextResponse.json({ user: await requireUser() }));
}
