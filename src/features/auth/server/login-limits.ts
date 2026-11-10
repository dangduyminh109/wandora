import { createHash } from 'node:crypto';
import { isIP } from 'node:net';

// Giới hạn số lần đăng nhập. Không import 'server-only' để kiểm thử được bằng test thuần.
//
// Chỉ giới hạn theo email thì ai cũng khoá được tài khoản người khác bằng vài lần đoán sai, nên khóa
// theo từng cặp (email, IP): kẻ đoán bị chặn còn chủ tài khoản ở IP khác vẫn đăng nhập được. Bộ đếm
// riêng theo email (ngưỡng cao hơn) vẫn chặn kiểu đoán mật khẩu phân tán nhiều IP, và bộ đếm theo IP
// chặn một nguồn thử nhiều email.

export const LOGIN_WINDOW_SECONDS = 15 * 60;

export type LimitBucket = {
  key: string;
  limit: number;
  // Xóa khi đăng nhập thành công (bộ đếm theo IP thì giữ lại để vẫn chặn việc thử nhiều tài khoản).
  clearOnSuccess: boolean;
};

const digest = (value: string) => createHash('sha256').update(value).digest('hex');

export function loginBuckets(email: string, ip?: string | null): LimitBucket[] {
  const emailKey = `wandora:login:${digest(email)}`;
  // Không biết IP (chạy local, không qua proxy): chỉ còn cách đếm theo email như trước.
  // Đừng gộp mọi người vào một bộ đếm "unknown" kẻo một người chặn được tất cả.
  if (!ip) return [{ key: emailKey, limit: 10, clearOnSuccess: true }];
  return [
    { key: emailKey, limit: 50, clearOnSuccess: true },
    { key: `wandora:login:pair:${digest(`${email}|${ip}`)}`, limit: 10, clearOnSuccess: true },
    { key: `wandora:login:ip:${digest(ip)}`, limit: 100, clearOnSuccess: false },
  ];
}

// Lấy IP client. Phần tử CUỐI của X-Forwarded-For do proxy gần nhất thêm vào nên đáng tin hơn các
// phần tử đứng trước (client tự đặt được). Chỉ đáng tin khi ứng dụng chạy sau reverse proxy ghi/nối
// header này; nếu mở thẳng ra Internet thì kẻ tấn công đổi header để né giới hạn theo IP, và khi đó
// vẫn còn giới hạn theo email (ngưỡng 50) làm chốt chặn.
export function clientIp(headers: Pick<Headers, 'get'>): string | null {
  const forwarded = headers.get('x-forwarded-for')?.split(',').at(-1)?.trim();
  const candidate = forwarded || headers.get('x-real-ip')?.trim();
  return candidate && isIP(candidate) ? candidate : null;
}
