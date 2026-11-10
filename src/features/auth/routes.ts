import type { User } from '@/types/user';

// Trang chủ sau đăng nhập: admin vào khu quản trị, người dùng vào không gian cá nhân.
export const homeForRole = (role: User['role']) => (role === 'admin' ? '/admin' : '/dashboard');

// Chỉ nhận đường dẫn nội bộ ("/x"), chặn "//host" và "/\host" để tránh open redirect.
export function safeRedirect(target: string | null | undefined) {
  if (!target || !target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) {
    return null;
  }
  return target;
}

// Người dùng thường không được vào /admin; nếu redirect trỏ vào đó thì bỏ qua.
export function postLoginTarget(user: Pick<User, 'role'>, redirect?: string | null) {
  const safe = safeRedirect(redirect);
  if (!safe) return homeForRole(user.role);
  if (user.role !== 'admin' && (safe === '/admin' || safe.startsWith('/admin/'))) {
    return homeForRole(user.role);
  }
  return safe;
}
