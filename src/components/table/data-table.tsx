'use client';
import {
  Box,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { TableHeader } from './table-header';
import { TablePagination } from './table-pagination';
import type { DataTableProps } from './types';
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  toolbar,
  pagination,
  loading = false,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  sort,
  onSortChange,
}: DataTableProps<T>) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }} aria-busy={loading}>
      {toolbar}
      <TableContainer sx={{ overflowX: 'auto' }} tabIndex={0} role="region" aria-label={caption}>
        <Table sx={{ minWidth: 560 }}>
          <caption
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              overflow: 'hidden',
              clipPath: 'inset(50%)',
            }}
          >
            {caption}
          </caption>
          <TableHeader columns={columns} sort={sort} onSortChange={onSortChange} />
          <TableBody>
            {loading ? (
              Array.from({ length: Math.min(pagination?.pageSize ?? 5, 5) }, (_, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      <Skeleton aria-label="Đang tải dữ liệu" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <ErrorState message={error} onRetry={onRetry} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={rowKey(row)} hover>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align}
                      sx={{ overflowWrap: 'anywhere' }}
                    >
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {pagination && (
        <Box>
          <TablePagination {...pagination} />
        </Box>
      )}
    </Paper>
  );
}
