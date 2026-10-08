import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import '@fontsource/geist/400.css';
import '@fontsource/geist/500.css';
import '@fontsource/geist/600.css';
import './globals.css';
export const metadata: Metadata = { title: { default: 'Wandora', template: '%s | Wandora' }, description: 'Quản lý và khám phá địa điểm du lịch cùng Wandora.', robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body><a className="skip" href="#main">Đến nội dung chính</a><header className="header"><Link className="brand" href="/"><Image src="/brand/wandora-mark.svg" width={32} height={32} alt="" priority />Wandora</Link><span className="muted small">Hành trình bắt đầu từ đây</span></header><main id="main">{children}</main><footer className="footer">Wandora · Không gian dành cho những hành trình mới</footer></body></html>;
}
