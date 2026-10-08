import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/login-form';
export const metadata: Metadata = { title: 'Đăng nhập' };
export default function LoginPage() {
  return <div className="login-layout"><section className="intro"><div className="journey" aria-hidden="true"><svg viewBox="0 0 400 260" fill="none"><path d="M30 210C80 210 65 100 145 100S230 220 280 140 300 50 370 50" stroke="currentColor" strokeWidth="2" strokeDasharray="6 8" /><circle cx="30" cy="210" r="8" fill="currentColor" /><circle cx="370" cy="50" r="12" fill="currentColor" /><path d="m125 174 45-87 44 87h-89Z" stroke="currentColor" strokeWidth="2" /><path d="m153 120 17 14 14-14" stroke="currentColor" strokeWidth="2" /></svg></div><h1>Mỗi hành trình,<br />một khám phá mới.</h1><p>Không gian quản lý địa điểm, dịch vụ và những trải nghiệm du lịch của bạn.</p></section><section className="panel login-panel"><h2>Chào mừng đến Wandora</h2><p className="muted">Đăng nhập để tiếp tục hành trình.</p><LoginForm /></section></div>;
}
