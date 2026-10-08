'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section className="panel"><h1>Chưa thể mở Wandora</h1><p>Dịch vụ tạm thời chưa sẵn sàng. Vui lòng thử lại sau.</p><button onClick={reset}>Thử lại</button><p><Link href="/login">Về trang đăng nhập</Link></p></section>;
}
