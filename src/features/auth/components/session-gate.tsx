'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { refreshSession } from '@/lib/api-client';
export function SessionGate() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    refreshSession().then(response => {
      if (!active) return;
      if (response.ok) router.refresh();
      else if (response.status === 401) router.replace('/login');
      else setError('Không thể kết nối dịch vụ. Vui lòng thử lại.');
    }).catch(() => { if (active) setError('Không thể kết nối dịch vụ. Vui lòng thử lại.'); });
    return () => { active = false; };
  }, [router, attempt]);
  return <section className="panel"><h1>Đang mở Wandora</h1>{error ? <><p role="alert" className="error">{error}</p><button onClick={() => { setError(''); setAttempt(value => value + 1); }}>Thử lại</button></> : <div className="skeleton" aria-label="Đang kiểm tra phiên đăng nhập" />}</section>;
}
