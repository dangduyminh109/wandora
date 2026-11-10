import { currentUser } from '@/features/auth/server/session';
import { PublicLayout } from '@/components/layout/public-layout';
import { WorkspaceLayout } from '@/components/layout/workspace-layout';
import { LogoutButton } from '@/features/auth/components/logout-button';

// Khám phá mở cho khách, nhưng người đã đăng nhập giữ nguyên sidebar của không gian cá nhân
// thay vì bị chuyển sang giao diện trang giới thiệu.
export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) return <PublicLayout>{children}</PublicLayout>;
  return (
    <WorkspaceLayout
      user={user}
      sidebarFooter={<LogoutButton />}
      compactSidebarFooter={<LogoutButton compact />}
    >
      {children}
    </WorkspaceLayout>
  );
}
