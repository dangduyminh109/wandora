import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from '../image-policy';

export const UPLOAD_DIRECTORY = path.resolve(
  process.env.UPLOAD_DIR || path.join(process.cwd(), 'data/uploads'),
);
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 64 * 1024;

export class ImageUploadError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Bound the actual streamed body too; Content-Length alone can be omitted or forged.
export async function readImageForm(request: Request) {
  const type = request.headers.get('content-type') ?? '';
  if (!type.toLowerCase().startsWith('multipart/form-data;'))
    throw new ImageUploadError(415, 'Gửi ảnh bằng multipart/form-data.');
  if (Number(request.headers.get('content-length')) > MAX_REQUEST_BYTES)
    throw new ImageUploadError(413, 'Ảnh không được vượt quá 5 MB.');
  const reader = request.body?.getReader();
  if (!reader) throw new ImageUploadError(400, 'Chưa chọn ảnh.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new ImageUploadError(413, 'Ảnh không được vượt quá 5 MB.');
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  let form: FormData;
  try {
    form = await new Response(new Uint8Array(Buffer.concat(chunks)), {
      headers: { 'Content-Type': type },
    }).formData();
  } catch {
    throw new ImageUploadError(400, 'Dữ liệu tải ảnh không hợp lệ.');
  }
  const entries = [...form.entries()];
  const file = form.get('file');
  if (entries.length !== 1 || !(file instanceof File))
    throw new ImageUploadError(400, 'Mỗi yêu cầu cần đúng một file ảnh.');
  return file;
}

export async function storeImage(file: File, directory = UPLOAD_DIRECTORY) {
  if (!file.size) throw new ImageUploadError(400, 'File ảnh trống.');
  if (file.size > MAX_IMAGE_BYTES) throw new ImageUploadError(413, 'Ảnh không được vượt quá 5 MB.');
  if (!(IMAGE_MIME_TYPES as readonly string[]).includes(file.type))
    throw new ImageUploadError(415, 'Chỉ hỗ trợ JPG, PNG và WebP.');
  let output: Buffer;
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 40_000_000,
      failOn: 'warning',
    });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format ?? ''))
      throw new Error('Unsupported decoded image format');
    output = await image
      .rotate()
      .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new ImageUploadError(
      415,
      'Không đọc được ảnh. Hãy chọn file JPG, PNG hoặc WebP hợp lệ, tối đa 40 triệu điểm ảnh.',
    );
  }
  const filename = `${randomUUID()}.webp`;
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), output, { flag: 'wx' });
  return { url: `/api/uploads/${filename}`, size: output.length };
}
