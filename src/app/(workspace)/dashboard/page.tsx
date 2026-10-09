import { currentUser } from '@/features/auth/server/session';
import { DashboardView } from '@/features/home/components/dashboard-view';
export default async function DashboardPage() {
  const user = await currentUser();
  return user ? <DashboardView user={user} /> : null;
}
