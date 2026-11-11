'use client';
import { useEffect, useState } from 'react';
import { Alert, Box, Button, Stack } from '@mui/material';
import { toast } from 'sonner';
import { DataTable } from '@/components/table/data-table';
import { TableToolbar } from '@/components/table/table-toolbar';
import type { TableColumn, TableSort } from '@/components/table/types';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageHeader } from '@/components/ui/page-header';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { api } from '@/lib/api-client';
import { catalogConfigs, serviceTypeLabels, type CatalogKind } from '../form-config';
import { CatalogFormDialog, type EditableItem } from './catalog-form-dialog';
import { PlaceAutocomplete, type PlaceOption } from './place-autocomplete';
import { EntityThumbnail } from '@/features/places/components/entity-thumbnail';

type Row = EditableItem & { name: string; slug: string; priceLevel: number } & Record<
    string,
    unknown
  >;

const price = (level: number) => '₫'.repeat(level);
const list = (value: unknown) => (Array.isArray(value) ? value.join(', ') : '');

const extraColumns: Record<CatalogKind, TableColumn<Row>[]> = {
  hotels: [
    { id: 'stars', label: 'Hạng', render: (row) => `${row.stars}★` },
    { id: 'amenities', label: 'Tiện nghi', render: (row) => list(row.amenities) || '—' },
  ],
  restaurants: [
    { id: 'cuisine', label: 'Loại món', render: (row) => list(row.cuisine) || '—' },
    { id: 'openingHours', label: 'Giờ mở cửa', render: (row) => String(row.openingHours || '—') },
  ],
  services: [
    {
      id: 'type',
      label: 'Loại',
      render: (row) => serviceTypeLabels[String(row.type)] ?? String(row.type),
    },
  ],
};

export function CatalogAdminView({ kind }: { kind: CatalogKind }) {
  const config = catalogConfigs[kind];
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [filterPlace, setFilterPlace] = useState<PlaceOption | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<TableSort>({ field: 'createdAt', direction: 'desc' });
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState({
    items: [] as Row[],
    total: 0,
    placeNames: {} as Record<string, string>,
  });
  const [resolvedKey, setResolvedKey] = useState('');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [dialog, setDialog] = useState<{ item: Row | null } | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [pending, setPending] = useState(false);

  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    search: debouncedSearch,
    placeId: filterPlace?.id ?? '',
    sortBy: sort.field,
    direction: sort.direction,
  }).toString();
  const requestKey = `${query}|${reload}`;
  const loading = resolvedKey !== requestKey || search !== debouncedSearch;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    api<typeof result>(`${config.endpoint}?${query}`, { signal: controller.signal })
      .then((data) => {
        if (!active) return;
        setResult(data);
        setError('');
        setResolvedKey(requestKey);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu.');
        setResolvedKey(requestKey);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [config.endpoint, query, requestKey]);

  const columns: TableColumn<Row>[] = [
    {
      id: 'images',
      label: 'Ảnh',
      width: 112,
      render: (row) => (
        <Stack spacing={0.5}>
          <EntityThumbnail
            images={
              Array.isArray(row.images)
                ? row.images.filter((image): image is string => typeof image === 'string')
                : []
            }
            name={row.name}
          />
          {Array.isArray(row.images) &&
            Array.isArray(row.illustrativeImages) &&
            row.images.some((image) => (row.illustrativeImages as unknown[]).includes(image)) && (
              <Box component="span" sx={{ typography: 'caption', color: 'text.secondary' }}>
                Ảnh minh họa
              </Box>
            )}
        </Stack>
      ),
    },
    {
      id: 'name',
      label: config.title,
      sortable: true,
      render: (row) => (
        <>
          <Box component="span" sx={{ fontWeight: 600, display: 'block' }}>
            {row.name}
          </Box>
          <Box component="span" sx={{ typography: 'body2', color: 'text.secondary' }}>
            /{row.slug}
          </Box>
        </>
      ),
    },
    { id: 'place', label: 'Địa điểm', render: (row) => result.placeNames[row.placeId] ?? '—' },
    ...extraColumns[kind],
    { id: 'priceLevel', label: 'Giá', sortable: true, render: (row) => price(row.priceLevel) },
    {
      id: 'actions',
      label: 'Thao tác',
      render: (row) => (
        <Stack direction="row" spacing={1}>
          <Button aria-label={`Chỉnh sửa ${row.name}`} onClick={() => setDialog({ item: row })}>
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
  ];

  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        breadcrumbs={[{ label: 'Quản trị', href: '/admin' }, { label: config.title }]}
      />
      {actionError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {actionError}
        </Alert>
      )}
      <DataTable
        columns={columns}
        rows={result.items}
        rowKey={(row) => row.id}
        caption={`Danh sách ${config.singular}`}
        loading={loading}
        error={resolvedKey === requestKey ? error : undefined}
        onRetry={() => setReload((value) => value + 1)}
        emptyTitle={
          search || filterPlace ? `Không tìm thấy ${config.singular}` : `Chưa có ${config.singular}`
        }
        emptyDescription={
          search || filterPlace
            ? 'Thử đổi từ khóa hoặc bỏ lọc địa điểm.'
            : `Thêm ${config.singular} đầu tiên để bắt đầu.`
        }
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          setPage(0);
        }}
        toolbar={
          <TableToolbar
            title={`Danh sách ${config.singular}`}
            description={`${result.total} bản ghi`}
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(0);
            }}
            searchPlaceholder={config.searchPlaceholder}
            createLabel={`Thêm ${config.singular}`}
            onCreate={() => setDialog({ item: null })}
            actions={
              <Box sx={{ width: { xs: '100%', sm: 280 } }}>
                <PlaceAutocomplete
                  size="small"
                  label="Lọc theo địa điểm"
                  value={filterPlace}
                  onChange={(next) => {
                    setFilterPlace(next);
                    setPage(0);
                  }}
                />
              </Box>
            }
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
      {dialog && (
        <CatalogFormDialog
          config={config}
          item={dialog.item}
          placeNames={result.placeNames}
          defaultPlace={filterPlace}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            setReload((value) => value + 1);
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        title={`Xóa ${config.singular}?`}
        description={`"${deleting?.name ?? ''}" sẽ bị xóa vĩnh viễn.`}
        confirmLabel="Xóa"
        destructive
        pending={pending}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          setPending(true);
          try {
            await api(`${config.endpoint}/${deleting.id}`, { method: 'DELETE' });
            toast.success(`Đã xóa ${config.singular}.`);
            setDeleting(null);
            setReload((value) => value + 1);
          } catch (err) {
            setDeleting(null);
            setActionError(err instanceof Error ? err.message : 'Không thể xóa.');
          } finally {
            setPending(false);
          }
        }}
      />
    </>
  );
}
