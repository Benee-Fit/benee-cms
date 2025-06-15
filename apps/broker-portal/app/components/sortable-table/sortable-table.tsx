'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/design-system/components/ui/table';
import { ChevronUp, ChevronDown, Edit2 } from 'lucide-react';

type SortDirection = 'asc' | 'desc';

// EditableTableCell component for inline editing
interface EditableTableCellProps {
  value: string;
  onUpdate: (value: string) => void;
  isNumeric?: boolean;
  className?: string;
  isCurrency?: boolean;
  isEditMode?: boolean;
}

const EditableTableCell: React.FC<EditableTableCellProps> = ({ 
  value, 
  onUpdate, 
  isNumeric = false,
  className = '',
  isCurrency = false,
  isEditMode = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  // For currency values, strip the $ for editing but keep the number
  const getEditValue = (val: string) => {
    if (isCurrency && val.startsWith('$')) {
      return val.replace(/[$,]/g, '');
    }
    return val;
  };

  // For currency values, ensure $ is prepended when saving
  const getSaveValue = (val: string) => {
    if (isCurrency && val !== '-' && val !== '') {
      const numericValue = val.replace(/[^0-9.-]/g, '');
      if (numericValue && !isNaN(Number(numericValue))) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(Number(numericValue));
      }
    }
    return val;
  };

  const handleBlur = () => {
    setIsEditing(false);
    const savedValue = getSaveValue(tempValue);
    onUpdate(savedValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      const savedValue = getSaveValue(tempValue);
      onUpdate(savedValue);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempValue(getEditValue(value));
    }
  };

  // Update tempValue when value prop changes
  React.useEffect(() => {
    setTempValue(getEditValue(value));
  }, [value]);

  if (!isEditMode) {
    return <span className={className}>{value}</span>;
  }

  if (isEditing) {
    return (
      <div className="relative">
        <input
          type={isNumeric ? 'number' : 'text'}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full ${isCurrency ? 'pl-6' : 'pl-2'} pr-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          autoFocus
        />
      </div>
    );
  }

  return (
    <div 
      className="group relative cursor-pointer hover:bg-blue-50 rounded px-2 py-1"
      onClick={() => setIsEditing(true)}
    >
      <span className={className}>{value}</span>
      <Edit2 className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

export interface ColumnConfig<T> {
  key: keyof T;
  header: string;
  type: 'string' | 'number' | 'currency';
  align?: 'left' | 'right' | 'center';
  render?: (value: any, item: T) => React.ReactNode;
  editable?: boolean;
  onUpdate?: (item: T, value: any) => void;
}

interface SortableTableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  defaultSortKey?: keyof T;
  defaultSortDirection?: SortDirection;
  onRowClick?: (item: T) => void;
  className?: string;
  isEditMode?: boolean;
}

export function SortableTable<T extends Record<string, any>>({
  data,
  columns,
  defaultSortKey,
  defaultSortDirection = 'asc',
  onRowClick,
  className,
  isEditMode,
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
    
    // Handle null/undefined values
    if (value === null || value === undefined) {
      return column.type === 'currency' ? '$0' : '—';
    }
    
    switch (column.type) {
      case 'currency':
        const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
        return `$${numValue.toLocaleString()}`;
      case 'number':
        const numberValue = typeof value === 'number' ? value : parseFloat(value) || 0;
        return numberValue.toLocaleString();
      default:
        return value;
    }
  };

  const renderEditableCell = (column: ColumnConfig<T>, item: T) => {
    const value = item[column.key];
    const isNumeric = column.type === 'number';
    const isCurrency = column.type === 'currency';

    return (
      <EditableTableCell
        value={String(value)}
        onUpdate={(newValue) => column.onUpdate?.(item, newValue)}
        isNumeric={isNumeric}
        isCurrency={isCurrency}
        isEditMode={isEditMode}
      />
    );
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
                
                if (column.editable && isEditMode) {
                  return (
                    <TableCell 
                      key={String(column.key)} 
                      className={`${alignClass} ${isFirstColumn ? 'font-medium' : ''}`}
                    >
                      {renderEditableCell(column, item)}
                    </TableCell>
                  );
                }

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