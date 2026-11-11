'use client';
import { useEffect, useState } from 'react';
import { DataTable } from '@/components/table/data-table';
import { TableToolbar } from '@/components/table/table-toolbar';
import type { TableColumn, TableSort } from '@/components/table/types';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { api } from '@/lib/api-client';
import type { User } from '@/types/user';
import { Alert, Avatar, Button, Stack } from '@mui/material';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EditUserDialog } from './edit-user-dialog';
const columns: TableColumn<User>[] = [
  {
    id: 'avatar',
    label: 'Ảnh',
    width: 64,
    render: (row) => (
      <Avatar
        src={row.avatar || undefined}
        alt={row.name}
        sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: '.875rem' }}
      >
        {row.name ? row.name.charAt(0).toUpperCase() : 'U'}
      </Avatar>
    ),
  },
  { id: 'name', label: 'Họ tên', sortable: true, render: (row) => row.name },
  { id: 'email', label: 'Email', sortable: true, render: (row) => row.email },
  {
    id: 'role',
    label: 'Quyền truy cập',
    sortable: true,
    render: (row) => (
      <Badge
        color={row.role === 'admin' ? 'primary' : 'default'}
        label={row.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
      />
    ),
  },
  {
    id: 'createdAt',
    label: 'Ngày tạo',
    sortable: true,
    render: (row) =>
      new Date(row.createdAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Bangkok' }),
  },
];
export function UsersTable({ currentUserId }: { currentUserId: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState<User | null>(null);
  const [locking, setLocking] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<TableSort>({ field: 'createdAt', direction: 'desc' });
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState({ users: [] as User[], total: 0 });
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
    api<{ users: User[]; total: number }>('/api/users?' + query, { signal: controller.signal })
      .then((data) => {
        if (!active) return;
        setResult(data);
        setResolvedKey(requestKey);
        setError('');
      })
      .catch((error) => {
        if (active) {
          setResolvedKey(requestKey);
          setError(error instanceof Error ? error.message : 'Không thể tải người dùng.');
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [query, requestKey]);
  function changeSearch(value: string) {
    setSearch(value);
    setPage(0);
  }
  return (
    <>
      <PageHeader
        title="Người dùng"
        description="Quản lý tài khoản và quyền truy cập của thành viên."
        breadcrumbs={[{ label: 'Quản trị', href: '/admin' }, { label: 'Người dùng' }]}
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
            id: 'status',
            label: 'Trạng thái',
            render: (row) => (
              <Badge
                label={row.status === 'locked' ? 'Đã khóa' : 'Hoạt động'}
                color={row.status === 'locked' ? 'error' : 'success'}
              />
            ),
          },
          {
            id: 'actions',
            label: 'Thao tác',
            render: (row) => (
              <Stack direction="row" spacing={1}>
                <Button
                  aria-label={`Chỉnh sửa ${row.email}`}
                  onClick={() => {
                    setActionError('');
                    setEditing(row);
                  }}
                >
                  Sửa
                </Button>
                <Button
                  color={row.status === 'locked' ? 'primary' : 'error'}
                  disabled={row.id === currentUserId}
                  aria-label={`${row.status === 'locked' ? 'Mở khóa' : 'Khóa'} ${row.email}`}
                  onClick={() => {
                    setActionError('');
                    setLocking(row);
                  }}
                >
                  {row.status === 'locked' ? 'Mở khóa' : 'Khóa'}
                </Button>
              </Stack>
            ),
          },
        ]}
        rows={result.users}
        rowKey={(row) => row.id}
        caption="Danh sách người dùng Wandora"
        loading={loading}
        error={resolvedKey === requestKey ? error : undefined}
        onRetry={() => {
          setReload((value) => value + 1);
        }}
        emptyTitle={search ? 'Không tìm thấy tài khoản' : 'Chưa có người dùng'}
        emptyDescription={
          search
            ? 'Thử tìm bằng tên hoặc email khác.'
            : 'Tạo tài khoản đầu tiên để cấp quyền truy cập.'
        }
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          setPage(0);
        }}
        toolbar={
          <TableToolbar
            title="Danh sách tài khoản"
            description={`${result.total} tài khoản`}
            search={search}
            onSearchChange={changeSearch}
            searchPlaceholder="Tìm theo tên hoặc email"
            createHref="/admin/users/create"
            createLabel="Tạo tài khoản"
          />
        }
        pagination={{
          page,
          pageSize,
          total: result.total,
          onPageChange: (next) => {
            setPage(next);
          },
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(0);
          },
        }}
      />
      {editing && (
        <EditUserDialog
          key={editing.id}
          user={editing}
          self={editing.id === currentUserId}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setReload((value) => value + 1);
            router.refresh();
          }}
        />
      )}
      <ConfirmDialog
        open={!!locking}
        title={locking?.status === 'locked' ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?'}
        description={
          locking?.status === 'locked'
            ? `${locking.email} sẽ có thể đăng nhập lại.`
            : `${locking?.email ?? ''} sẽ không thể đăng nhập. Các phiên hiện tại sẽ hết hiệu lực.`
        }
        confirmLabel={locking?.status === 'locked' ? 'Mở khóa' : 'Khóa tài khoản'}
        destructive={locking?.status !== 'locked'}
        pending={saving}
        onClose={() => setLocking(null)}
        onConfirm={async () => {
          if (!locking) return;
          setSaving(true);
          try {
            await api(`/api/users/${locking.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ status: locking.status === 'locked' ? 'active' : 'locked' }),
            });
            toast.success(
              locking.status === 'locked' ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.',
            );
            setReload((value) => value + 1);
            setLocking(null);
          } catch (error) {
            setActionError(
              error instanceof Error ? error.message : 'Không thể cập nhật tài khoản.',
            );
            setLocking(null);
          } finally {
            setSaving(false);
          }
        }}
      />
    </>
  );
}
