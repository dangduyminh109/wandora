import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getEnv } from '@/config/env';
import { isAllowedOrigin } from './request-origin';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function assertSameOrigin(request: Request) {
  if (
    !isAllowedOrigin(
      request.headers.get('origin'),
      getEnv().APP_URL,
      request.url,
      process.env.NODE_ENV === 'development',
    )
  )
    throw new HttpError(403, 'Yêu cầu không hợp lệ.');
}
export async function parseJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, 'Nội dung JSON không hợp lệ.');
  }
}
export async function handleApi(action: () => Promise<NextResponse>) {
  try {
    const response = await action();
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    const status =
      error instanceof HttpError ? error.status : error instanceof ZodError ? 400 : 503;
    const message =
      error instanceof HttpError
        ? error.message
        : error instanceof ZodError
          ? 'Kiểm tra lại thông tin đã nhập.'
          : 'Dịch vụ chưa sẵn sàng. Vui lòng thử lại sau.';
    // Ghi lỗi thật ở phía máy chủ (client vẫn chỉ nhận thông báo chung) để không phải đoán nguyên nhân 503.
    if (status === 503) console.error('API dependency or configuration failure:', error);
    return NextResponse.json(
      { error: message },
      { status, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
