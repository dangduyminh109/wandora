'use client';
import { TableCell, TableHead, TableRow, TableSortLabel } from '@mui/material';
import type { TableColumn, TableSort } from './types';
export function TableHeader<T>({
  columns,
  sort,
  onSortChange,
}: {
  columns: TableColumn<T>[];
  sort?: TableSort;
  onSortChange?: (sort: TableSort) => void;
}) {
  return (
    <TableHead>
      <TableRow>
        {columns.map((column) => (
          <TableCell
            key={column.id}
            align={column.align}
            scope="col"
            sx={{ width: column.width }}
            sortDirection={sort?.field === column.id ? sort.direction : false}
          >
            {column.sortable && onSortChange ? (
              <TableSortLabel
                active={sort?.field === column.id}
                direction={sort?.field === column.id ? sort.direction : 'asc'}
                onClick={() =>
                  onSortChange({
                    field: column.id,
                    direction:
                      sort?.field === column.id && sort.direction === 'asc' ? 'desc' : 'asc',
                  })
                }
              >
                {column.label}
              </TableSortLabel>
            ) : (
              column.label
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}
