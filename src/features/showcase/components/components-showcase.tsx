'use client';
import { useState } from 'react';
import { Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/table/data-table';
import { TableToolbar } from '@/components/table/table-toolbar';
import type { TableColumn, TableSort } from '@/components/table/types';
type Example = { id: number; name: string; type: string; status: string };
const examples: Example[] = [
  { id: 1, name: 'Địa điểm du lịch', type: 'Địa điểm', status: 'Đang phát triển' },
  { id: 2, name: 'Khách sạn', type: 'Lưu trú', status: 'Đang phát triển' },
  { id: 3, name: 'Nhà hàng', type: 'Ẩm thực', status: 'Đang phát triển' },
  { id: 4, name: 'Lịch sử hoạt động', type: 'Phân tích', status: 'Đang phát triển' },
  { id: 5, name: 'Đề xuất du lịch', type: 'Gợi ý', status: 'Đang phát triển' },
  { id: 6, name: 'Quản lý tài khoản', type: 'Người dùng', status: 'Sẵn sàng' },
];
const columns: TableColumn<Example>[] = [
  { id: 'name', label: 'Tên phân hệ', sortable: true, render: (row) => row.name },
  { id: 'type', label: 'Loại', render: (row) => row.type },
  {
    id: 'status',
    label: 'Trạng thái',
    render: (row) => (
      <Badge label={row.status} color={row.status === 'Sẵn sàng' ? 'success' : 'default'} />
    ),
  },
];
export function ComponentsShowcase() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [sort, setSort] = useState<TableSort>({ field: 'name', direction: 'asc' });
  const [state, setState] = useState('ready');
  const [confirm, setConfirm] = useState(false);
  const filtered = examples
    .filter((row) => row.name.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi') * (sort.direction === 'asc' ? 1 : -1));
  return (
    <>
      <PageHeader
        title="Component mẫu"
        description="Dữ liệu minh họa để kiểm tra các component dùng chung."
        breadcrumbs={[{ label: 'Quản trị', href: '/admin' }, { label: 'Component mẫu' }]}
      />
      <Stack spacing={3}>
        <Card title="Badge, card và dialog">
          <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge label="Sẵn sàng" color="success" />
            <Badge label="Đang phát triển" />
            <Badge label="Cần chú ý" color="warning" />
            <Button
              variant="outlined"
              onClick={() => toast.success('Toast hoạt động bình thường.')}
            >
              Thử toast
            </Button>
            <Button variant="outlined" onClick={() => setConfirm(true)}>
              Mở dialog
            </Button>
          </Stack>
        </Card>
        <DataTable
          columns={columns}
          rows={state === 'empty' ? [] : filtered.slice(page * pageSize, (page + 1) * pageSize)}
          rowKey={(row) => row.id}
          caption="Bảng minh họa các phân hệ"
          loading={state === 'loading'}
          error={
            state === 'error'
              ? 'Đây là trạng thái lỗi minh họa. Chọn Thử lại để quay về dữ liệu.'
              : undefined
          }
          onRetry={() => setState('ready')}
          emptyTitle="Chưa có kết quả"
          emptyDescription="Thay đổi từ khóa hoặc chuyển trạng thái về Có dữ liệu."
          sort={sort}
          onSortChange={(next) => {
            setSort(next);
            setPage(0);
          }}
          toolbar={
            <TableToolbar
              title="Table dùng chung"
              description="Dữ liệu minh họa, không phải danh sách địa điểm thật."
              search={search}
              onSearchChange={(value) => {
                setSearch(value);
                setPage(0);
              }}
              onCreate={() => setConfirm(true)}
              createLabel="Thử nút tạo"
              actions={
                <TextField
                  select
                  size="small"
                  label="Trạng thái"
                  value={state}
                  onChange={(event) => {
                    setState(event.target.value);
                    setPage(0);
                  }}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="ready">Có dữ liệu</MenuItem>
                  <MenuItem value="loading">Đang tải</MenuItem>
                  <MenuItem value="empty">Trống</MenuItem>
                  <MenuItem value="error">Lỗi</MenuItem>
                </TextField>
              }
            />
          }
          pagination={{
            page,
            pageSize,
            total: state === 'empty' ? 0 : filtered.length,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
        <Typography variant="body2" color="text.secondary">
          Table hỗ trợ dữ liệu phân trang từ API hoặc dữ liệu đã lọc ở client. Nút thử trong trang
          này chỉ hiển thị thông báo.
        </Typography>
      </Stack>
      <ConfirmDialog
        open={confirm}
        title="Thử dialog dùng chung"
        description="Thao tác này hiển thị toast xác nhận và không tạo bản ghi."
        confirmLabel="Hiển thị toast"
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          toast.success('Đã xác nhận thao tác mẫu.');
        }}
      />
    </>
  );
}
