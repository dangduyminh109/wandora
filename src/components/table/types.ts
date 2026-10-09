import type { ReactNode, Key } from 'react';
export type TableColumn<T> = {
  id: string;
  label: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  sortable?: boolean;
};
export type TableSort = { field: string; direction: 'asc' | 'desc' };
export type TablePaginationState = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};
export type DataTableProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => Key;
  caption: string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  toolbar?: ReactNode;
  pagination?: TablePaginationState;
  sort?: TableSort;
  onSortChange?: (sort: TableSort) => void;
};
