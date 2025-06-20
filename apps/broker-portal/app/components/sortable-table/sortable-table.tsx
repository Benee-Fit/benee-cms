'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/design-system/components/ui/table';
import { ChevronUp, ChevronDown } from 'lucide-react';

type SortDirection = 'asc' | 'desc';

export interface ColumnConfig<T> {
  key: keyof T;
  header: string;
  type: 'string' | 'number' | 'currency';
  align?: 'left' | 'right' | 'center';
  render?: (value: any, item: T) => React.ReactNode;
}

interface SortableTableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  defaultSortKey?: keyof T;
  defaultSortDirection?: SortDirection;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function SortableTable<T extends Record<string, any>>({
  data,
  columns,
  defaultSortKey,
  defaultSortDirection = 'asc',
  onRowClick,
  className,
}: SortableTableProps<T>) {
  const [sortField, setSortField] = useState<keyof T>(defaultSortKey || columns[0].key);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);

  const handleSort = (field: keyof T) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.toLowerCase().localeCompare(bValue.toLowerCase())
        : bValue.toLowerCase().localeCompare(aValue.toLowerCase());
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    }
    
    return 0;
  });

  const SortableHeader = ({ column }: { column: ColumnConfig<T> }) => {
    const isActive = sortField === column.key;
    const alignClass = column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : '';
    
    return (
      <TableHead 
        className={`cursor-pointer hover:bg-muted/50 select-none ${alignClass}`}
        onClick={() => handleSort(column.key)}
      >
        <div className={`flex items-center gap-1 ${column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : ''}`}>
          {column.header}
          {isActive && (
            sortDirection === 'asc' ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )
          )}
        </div>
      </TableHead>
    );
  };

  const renderCellValue = (column: ColumnConfig<T>, item: T) => {
    const value = item[column.key];
    
    if (column.render) {
      return column.render(value, item);
    }
    
    switch (column.type) {
      case 'currency':
        return `$${(value as number).toLocaleString()}`;
      case 'number':
        return (value as number).toLocaleString();
      default:
        return value;
    }
  };

  return (
    <div className={`border rounded-lg ${className || ''}`}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <SortableHeader key={String(column.key)} column={column} />
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((item, index) => (
            <TableRow 
              key={index}
              className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => {
                const alignClass = column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : '';
                const isFirstColumn = column === columns[0];
                
                return (
                  <TableCell 
                    key={String(column.key)} 
                    className={`${alignClass} ${isFirstColumn ? 'font-medium' : ''}`}
                  >
                    {renderCellValue(column, item)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}