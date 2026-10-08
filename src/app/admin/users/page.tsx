import Link from 'next/link';
import { currentUser } from '@/features/auth/server/session';
import { SessionGate } from '@/features/auth/components/session-gate';
import { CreateUserForm } from '@/features/users/components/create-user-form';
export const dynamic = 'force-dynamic';
export default async function UsersPage() {
  const user = await currentUser();
  if (!user) return <SessionGate />;
  if (user.role !== 'admin') return <section className="panel"><h1>Quyền truy cập giới hạn</h1><p>Chỉ quản trị viên có thể tạo tài khoản.</p><Link href="/dashboard">Về trang chính</Link></section>;
  return <section className="narrow"><Link href="/dashboard">Về trang chính</Link><div className="panel"><h1>Tạo tài khoản</h1><p className="muted">Cấp quyền truy cập Wandora cho thành viên mới.</p><CreateUserForm /></div></section>;
}
