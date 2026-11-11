import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginView } from '@/features/auth/components/login-view';
import { currentUser } from '@/features/auth/server/session';
import { postLoginTarget, safeRedirect } from '@/features/auth/routes';

export const metadata: Metadata = { title: 'Đăng ký' };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string | string[] }>;
}) {
  const raw = (await searchParams).redirect;
  const redirectTo = safeRedirect(Array.isArray(raw) ? raw[0] : raw) ?? undefined;
  const user = await currentUser();
  if (user) redirect(postLoginTarget(user, redirectTo));
  return <LoginView mode="register" redirectTo={redirectTo} />;
}
