'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError('');
    const data = new FormData(event.currentTarget);
    try {
      await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: data.get('email'), password: data.get('password') }) });
      router.push('/dashboard'); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : 'Không thể đăng nhập.'); }
    finally { setPending(false); }
  }
  return <form onSubmit={submit} className="form" aria-busy={pending}>
    <label htmlFor="email">Email<input id="email" name="email" type="email" autoComplete="username" maxLength={254} required placeholder="ban@example.com" /></label>
    <label htmlFor="password">Mật khẩu<input id="password" name="password" type="password" autoComplete="current-password" maxLength={128} required /></label>
    {error && <p className="error" role="alert">{error}</p>}
    <button disabled={pending} type="submit">{pending ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
    <p className="muted small">Chưa có tài khoản? Liên hệ quản trị viên để được cấp quyền truy cập.</p>
  </form>;
}
