import Link from 'next/link';
import { currentUser } from '@/features/auth/server/session';
import { SessionGate } from '@/features/auth/components/session-gate';
import { LogoutButton } from '@/features/auth/components/logout-button';
export const dynamic = 'force-dynamic';
export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) return <SessionGate />;
  return <section className="dashboard"><div className="page-heading"><div><p className="muted">Không gian của bạn</p><h1>Xin chào, {user.name}</h1></div><LogoutButton /></div><div className="panel"><h2>Chào mừng đến Wandora</h2><p>Tài khoản của bạn đã sẵn sàng. Các tính năng địa điểm và đề xuất du lịch đang được phát triển.</p>{user.role === 'admin' && <Link className="button" href="/admin/users">Tạo tài khoản người dùng</Link>}</div><dl className="account"><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Quyền truy cập</dt><dd>{user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}</dd></div></dl></section>;
}
