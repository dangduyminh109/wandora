import { UsersTable } from '@/features/users/components/users-table';
import { currentUser } from '@/features/auth/server/session';
import { SessionGate } from '@/features/auth/components/session-gate';
export default async function Page() {
  const user = await currentUser();
  return user ? <UsersTable currentUserId={user.id} /> : <SessionGate />;
}
