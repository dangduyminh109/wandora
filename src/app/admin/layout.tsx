import Link from 'next/link';
import { currentUser } from '@/features/auth/server/session';
import { SessionGate } from '@/features/auth/components/session-gate';

import { WorkspaceLayout } from '@/components/layout/workspace-layout';
import { AccessDenied } from '@/components/layout/access-denied';
import { LogoutButton } from '@/features/auth/components/logout-button';
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) return <SessionGate />;
  if (user.role !== 'admin')
    return <AccessDenied action={<Link href="/dashboard">Về không gian cá nhân</Link>} />;
  return (
    <WorkspaceLayout
      user={user}
      admin
      sidebarFooter={<LogoutButton />}
      compactSidebarFooter={<LogoutButton compact />}
    >
      {children}
    </WorkspaceLayout>
  );
}
