'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { toast } from 'sonner';
import { DataTable } from '@/components/table/data-table';
import { TableToolbar } from '@/components/table/table-toolbar';
import type { TableColumn, TableSort } from '@/components/table/types';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageHeader } from '@/components/ui/page-header';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { api } from '@/lib/api-client';
import { categoryLabel } from '../constants';
import type { Place } from '../types';
import { EntityThumbnail } from './entity-thumbnail';

const columns: TableColumn<Place>[] = [
  {
    id: 'image',
    label: 'Ảnh',
    width: 112,
    render: (row) => <EntityThumbnail images={row.images} name={row.name} />,
  },
  {
    id: 'name',
    label: 'Địa điểm',
    sortable: true,
    render: (row) => (
      <>
        <Typography component="span" sx={{ fontWeight: 600, display: 'block' }}>
          {row.name}
        </Typography>
        <Typography component="span" variant="body2" color="text.secondary">
          /{row.slug}
        </Typography>
      </>
    ),
  },
  {
    id: 'category',
    label: 'Danh mục',
    render: (row) => <Badge label={categoryLabel(row.category)} />,
  },
  { id: 'region', label: 'Khu vực', render: (row) => row.region },
  {
    id: 'ratingAvg',
    label: 'Đánh giá',
    sortable: true,
    render: (row) =>
      row.ratingCount > 0 ? `${row.ratingAvg.toFixed(1)} (${row.ratingCount})` : 'Chưa có',
  },
  {
    id: 'createdAt',
    label: 'Ngày tạo',
    sortable: true,
    render: (row) =>
      new Date(row.createdAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Bangkok' }),
  },
];

export function PlacesTable() {
  const [deleting, setDeleting] = useState<Place | null>(null);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<TableSort>({ field: 'createdAt', direction: 'desc' });
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState({ places: [] as Place[], total: 0 });
  const [resolvedKey, setResolvedKey] = useState('');
  const [error, setError] = useState('');

  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    search: debouncedSearch,
    sortBy: sort.field,
    direction: sort.direction,
  }).toString();
  const requestKey = `${query}|${reload}`;
  const loading = resolvedKey !== requestKey || search !== debouncedSearch;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    api<{ places: Place[]; total: number }>('/api/places?' + query, {
      signal: controller.signal,
    })
      .then((data) => {
        if (!active) return;
        setResult(data);
        setResolvedKey(requestKey);
        setError('');
      })
      .catch((error) => {
        if (active) {
          setResolvedKey(requestKey);
          setError(error instanceof Error ? error.message : 'Không thể tải địa điểm.');
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [query, requestKey]);

  return (
    <>
      <PageHeader
        title="Địa điểm"
        description="Quản lý địa điểm du lịch hiển thị trên Wandora."
        breadcrumbs={[{ label: 'Quản trị', href: '/admin' }, { label: 'Địa điểm' }]}
      />
      {actionError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {actionError}
        </Alert>
      )}
      <DataTable
        columns={[
          ...columns,
          {
            id: 'actions',
            label: 'Thao tác',
            render: (row) => (
              <Stack direction="row" spacing={1}>
                <Button
                  component={Link}
                  href={`/admin/places/${row.id}/edit`}
                  aria-label={`Chỉnh sửa ${row.name}`}
                >
                  Sửa
                </Button>
                <Button
                  color="error"
                  aria-label={`Xóa ${row.name}`}
                  onClick={() => {
                    setActionError('');
                    setDeleting(row);
                  }}
                >
                  Xóa
                </Button>
              </Stack>
            ),
          },
        ]}
        rows={result.places}
        rowKey={(row) => row.id}
        caption="Danh sách địa điểm du lịch"
        loading={loading}
        error={resolvedKey === requestKey ? error : undefined}
        onRetry={() => setReload((value) => value + 1)}
        emptyTitle={search ? 'Không tìm thấy địa điểm' : 'Chưa có địa điểm'}
        emptyDescription={
          search ? 'Thử tìm bằng từ khóa khác.' : 'Thêm địa điểm đầu tiên để bắt đầu.'
        }
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          setPage(0);
        }}
        toolbar={
          <TableToolbar
            title="Danh sách địa điểm"
            description={`${result.total} địa điểm`}
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(0);
            }}
            searchPlaceholder="Tìm theo tên, mô tả, thẻ"
            createHref="/admin/places/create"
            createLabel="Thêm địa điểm"
          />
        }
        pagination={{
          page,
          pageSize,
          total: result.total,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(0);
          },
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Xóa địa điểm?"
        description={`"${deleting?.name ?? ''}" cùng khách sạn, nhà hàng, dịch vụ và đánh giá gắn với địa điểm này sẽ bị xóa vĩnh viễn.`}
        confirmLabel="Xóa địa điểm"
        destructive
        pending={pending}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          setPending(true);
          try {
            await api(`/api/places/${deleting.id}`, { method: 'DELETE' });
            toast.success('Đã xóa địa điểm.');
            setReload((value) => value + 1);
          } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Không thể xóa địa điểm.');
          } finally {
            setPending(false);
            setDeleting(null);
          }
        }}
      />
    </>
  );
}
