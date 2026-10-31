import type { Metadata } from 'next';
import { Providers } from './providers';
import '@fontsource/geist/400.css';
import '@fontsource/geist/500.css';
import '@fontsource/geist/600.css';
import 'lenis/dist/lenis.css';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'Wandora', template: '%s | Wandora' },
  description: 'Quản lý và khám phá địa điểm du lịch cùng Wandora.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <a className="skip" href="#main">
          Đến nội dung chính
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
