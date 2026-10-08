'use client';
import { useState, type FormEvent } from 'react';
import { api } from '@/lib/api-client';
import type { User } from '@/types/user';
export function CreateUserForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true); setError(''); setSuccess('');
    try {
      const result = await api<{ user: User }>('/api/users', { method: 'POST', body: JSON.stringify(Object.fromEntries(data)) });
      setSuccess(`Đã tạo tài khoản ${result.user.email}.`); form.reset();
    } catch (error) { setError(error instanceof Error ? error.message : 'Không thể tạo tài khoản.'); }
    finally { setPending(false); }
  }
  return <form className="form" onSubmit={submit} aria-busy={pending}>
    <label htmlFor="name">Họ tên<input id="name" name="name" autoComplete="name" minLength={2} maxLength={100} required /></label>
    <label htmlFor="new-email">Email<input id="new-email" name="email" type="email" autoComplete="off" maxLength={254} required /></label>
    <label htmlFor="new-password">Mật khẩu ban đầu<input id="new-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required aria-describedby="password-hint" /></label>
    <p className="muted small" id="password-hint">Sử dụng ít nhất 12 ký tự.</p>
    <label htmlFor="role">Quyền truy cập<select id="role" name="role"><option value="user">Người dùng</option><option value="admin">Quản trị viên</option></select></label>
    {error && <p role="alert" className="error">{error}</p>}
    {success && <p role="status" className="success">{success}</p>}
    <button type="submit" disabled={pending}>{pending ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}</button>
  </form>;
}
