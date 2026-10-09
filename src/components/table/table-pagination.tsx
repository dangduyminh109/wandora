'use client';
import { TablePagination as MuiTablePagination } from '@mui/material';
import type { TablePaginationState } from './types';
export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: TablePaginationState) {
  return (
    <MuiTablePagination
      component="div"
      count={total}
      page={Math.min(page, Math.max(0, Math.ceil(total / pageSize) - 1))}
      rowsPerPage={pageSize}
      rowsPerPageOptions={[5, 10, 25, 50]}
      onPageChange={(_, next) => onPageChange(next)}
      onRowsPerPageChange={(event) => {
        onPageSizeChange(Number(event.target.value));
        onPageChange(0);
      }}
      labelRowsPerPage="Số dòng:"
      labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
      getItemAriaLabel={(type) =>
        ({ first: 'Trang đầu', last: 'Trang cuối', next: 'Trang sau', previous: 'Trang trước' })[
          type
        ]
      }
      sx={{
        '& .MuiTablePagination-toolbar': { flexWrap: 'wrap' },
        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { m: 1 },
      }}
    />
  );
}
