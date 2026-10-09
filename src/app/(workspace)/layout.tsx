import { currentUser } from '@/features/auth/server/session';
import { SessionGate } from '@/features/auth/components/session-gate';

import { WorkspaceLayout } from '@/components/layout/workspace-layout';
import { LogoutButton } from '@/features/auth/components/logout-button';
export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) return <SessionGate />;
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
