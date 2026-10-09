import { currentUser } from '@/features/auth/server/session';
import { SessionGate } from '@/features/auth/components/session-gate';
import { ProfileView } from '@/features/account/components/profile-view';
export default async function ProfilePage() {
  const user = await currentUser();
  return user ? <ProfileView user={user} /> : <SessionGate />;
}
