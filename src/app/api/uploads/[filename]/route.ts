import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { uploadFilenamePattern } from '@/features/places/image-policy';
import { UPLOAD_DIRECTORY } from '@/features/places/server/image-upload';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!uploadFilenamePattern.test(filename)) return new Response('Not found', { status: 404 });
  try {
    const image = await readFile(path.join(UPLOAD_DIRECTORY, filename));
    return new Response(new Uint8Array(image), {
      headers: {
        'Content-Type': 'image/webp',
        'Content-Length': String(image.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
      return new Response('Not found', { status: 404 });
    console.error('Failed to read uploaded image:', error);
    return new Response('Image unavailable', { status: 503 });
  }
}
