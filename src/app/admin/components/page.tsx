import { ComponentsShowcase } from '@/features/showcase/components/components-showcase';
import { notFound } from 'next/navigation';
export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ComponentsShowcase />;
}
