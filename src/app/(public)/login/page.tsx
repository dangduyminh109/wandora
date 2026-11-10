import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginView } from '@/features/auth/components/login-view';
import { currentUser } from '@/features/auth/server/session';
import { postLoginTarget, safeRedirect } from '@/features/auth/routes';

export const metadata: Metadata = { title: 'Đăng nhập' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string | string[] }>;
}) {
  const raw = (await searchParams).redirect;
  const redirectTo = safeRedirect(Array.isArray(raw) ? raw[0] : raw) ?? undefined;
  // Đã đăng nhập thì không hiện lại form, đưa về đúng khu vực theo vai trò.
  const user = await currentUser();
  if (user) redirect(postLoginTarget(user, redirectTo));
  return <LoginView redirectTo={redirectTo} />;
}
