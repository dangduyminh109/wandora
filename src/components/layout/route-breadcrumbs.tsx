'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Breadcrumbs, Typography } from '@mui/material';
const labels: Record<string, string> = {
  users: 'Người dùng',
  places: 'Địa điểm',
  hotels: 'Khách sạn',
  restaurants: 'Nhà hàng',
  services: 'Dịch vụ',
  components: 'Thư viện giao diện',
  dashboard: 'Tổng quan',
  favorites: 'Yêu thích',
  activity: 'Đã xem gần đây',
  profile: 'Tài khoản',
};
export function RouteBreadcrumbs() {
  const segments = usePathname().split('/').filter(Boolean);
  if (!segments.length) return null;
  const admin = segments[0] === 'admin';
  if (segments[0] === 'explore') {
    return (
      <Breadcrumbs aria-label="Đường dẫn trang" sx={{ mb: 3 }}>
        <Link href="/">Trang chủ</Link>
        <Link href="/explore">Khám phá</Link>
        <Typography color="text.primary" aria-current="page">
          Chi tiết địa điểm
        </Typography>
      </Breadcrumbs>
    );
  }
  const crumbs = [
    { href: admin ? '/admin' : '/dashboard', label: admin ? 'Quản trị' : 'Không gian cá nhân' },
  ];
  for (let i = admin ? 1 : 0; i < segments.length; i++) {
    const part = segments[i];
    const label =
      labels[part] ?? (part === 'create' ? 'Tạo mới' : part === 'edit' ? 'Chỉnh sửa' : null);
    if (label) crumbs.push({ href: '/' + segments.slice(0, i + 1).join('/'), label });
  }
  return (
    <Breadcrumbs aria-label="Đường dẫn trang" sx={{ mb: 3 }}>
      {crumbs.map((crumb, index) =>
        index === crumbs.length - 1 ? (
          <Typography key={crumb.href} color="text.primary" aria-current="page">
            {crumb.label}
          </Typography>
        ) : (
          <Link key={crumb.href} href={crumb.href}>
            {crumb.label}
          </Link>
        ),
      )}
    </Breadcrumbs>
  );
}
