import { ResetPasswordView } from '@/features/account/components/recovery-view';
export const metadata = {
  title: 'Đặt lại mật khẩu | Wandora',
  referrer: 'no-referrer' as const,
  robots: { index: false, follow: false },
};
export default function ResetPasswordPage() {
  return <ResetPasswordView />;
}
