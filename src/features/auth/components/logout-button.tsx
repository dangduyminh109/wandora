'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  return <div><button className="secondary" disabled={pending} onClick={async () => {
    setPending(true); setError('');
    try { await api('/api/auth/logout', { method: 'POST' }); router.replace('/login'); router.refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Không thể đăng xuất.'); }
    finally { setPending(false); }
  }}>{pending ? 'Đang đăng xuất…' : 'Đăng xuất'}</button>{error && <p className="error" role="alert">{error}</p>}</div>;
}
