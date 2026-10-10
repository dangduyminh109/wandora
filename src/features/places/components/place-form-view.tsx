'use client';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import type { Place } from '../types';
import { PlaceForm } from './place-form';

export function PlaceFormView({ place }: { place?: Place }) {
  const title = place ? 'Chỉnh sửa địa điểm' : 'Thêm địa điểm';
  return (
    <>
      <PageHeader
        title={title}
        description={
          place ? 'Cập nhật thông tin địa điểm du lịch.' : 'Nhập thông tin địa điểm du lịch mới.'
        }
        breadcrumbs={[
          { label: 'Quản trị', href: '/admin' },
          { label: 'Địa điểm', href: '/admin/places' },
          { label: title },
        ]}
      />
      <Card>
        <PlaceForm key={place?.id ?? 'new'} place={place} />
      </Card>
    </>
  );
}
