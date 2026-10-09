import { ForgotPasswordView } from '@/features/account/components/recovery-view';
export const metadata = {
  title: 'Quên mật khẩu | Wandora',
  robots: { index: false, follow: false },
};
export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
