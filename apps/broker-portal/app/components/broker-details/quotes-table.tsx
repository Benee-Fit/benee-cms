'use client';

import { useState } from 'react';
import { Badge } from '@repo/design-system/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/design-system/components/ui/table';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { Quote } from './broker-data';
import { LossReasonTooltip } from './loss-reason-tooltip';

interface QuotesTableProps {
  quotes: Quote[];
}

type SortField = 'companyName' | 'industry' | 'companySize' | 'sourceOfQuote' | 'status' | 'premium';
type SortDirection = 'asc' | 'desc';

export function QuotesTable({ quotes }: QuotesTableProps) {
  const [sortField, setSortField] = useState<SortField>('quoteDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedQuotes = [...quotes].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'companyName':
        aValue = a.companyName.toLowerCase();
        bValue = b.companyName.toLowerCase();
        break;
      case 'industry':
        aValue = a.industry.toLowerCase();
        bValue = b.industry.toLowerCase();
        break;
      case 'companySize':
        aValue = a.companySize;
        bValue = b.companySize;
        break;
      case 'sourceOfQuote':
        aValue = a.sourceOfQuote.toLowerCase();
        bValue = b.sourceOfQuote.toLowerCase();
        break;
      case 'status':
        aValue = a.status.toLowerCase();
        bValue = b.status.toLowerCase();
        break;
      case 'premium':
        aValue = a.premium;
        bValue = b.premium;
        break;
      default:
        aValue = a.quoteDate;
        bValue = b.quoteDate;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    }
  });

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        )}
      </div>
    </TableHead>
  );

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader field="companyName">Company Name</SortableHeader>
            <SortableHeader field="industry">Industry</SortableHeader>
            <SortableHeader field="companySize">Company Size</SortableHeader>
            <SortableHeader field="sourceOfQuote">Source of Quote</SortableHeader>
            <SortableHeader field="status">Case Won/Lost</SortableHeader>
            <SortableHeader field="premium">Premium</SortableHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedQuotes.map((quote) => (
            <TableRow key={quote.id}>
              <TableCell className="font-medium">{quote.companyName}</TableCell>
              <TableCell>{quote.industry}</TableCell>
              <TableCell className="text-right">{quote.companySize}</TableCell>
              <TableCell>{quote.sourceOfQuote}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Badge 
                    variant={quote.status === 'Won' ? 'default' : 'destructive'}
                    className={quote.status === 'Won' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
                  >
                    {quote.status}
                  </Badge>
                  {quote.status === 'Lost' && quote.lossReason && (
                    <LossReasonTooltip reason={quote.lossReason} />
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">${quote.premium.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}