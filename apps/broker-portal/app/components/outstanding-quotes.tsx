'use client';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@repo/design-system/components/ui/alert';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent } from '@repo/design-system/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/design-system/components/ui/dropdown-menu';
import { Input } from '@repo/design-system/components/ui/input';
import { cn } from '@repo/design-system/lib/utils';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Search,
} from 'lucide-react';
import { useState } from 'react';
import { SortableTable, type ColumnConfig } from './sortable-table/sortable-table';

interface OutstandingQuotesProps {
  className?: string;
}

interface Quote {
  id: string;
  client: string;
  date: string;
  carriers: string[];
  status: { carrier: string; received: boolean }[];
  waiting: string;
  followUp: string;
  age: number;
}

export function OutstandingQuotes({ className }: OutstandingQuotesProps) {
  const [filterText, setFilterText] = useState('');

  // Mock data for quotes
  const quotes: Quote[] = [
    {
      id: 'Q-1001',
      client: 'Nimbus Technologies',
      date: 'May 2, 2025',
      carriers: ['Manulife', 'Sun Life'],
      status: [
        { carrier: 'Manulife', received: true },
        { carrier: 'Sun Life', received: true },
      ],
      waiting: 'Complete',
      followUp: 'May 9, 2025',
      age: 5,
    },
    {
      id: 'Q-1002',
      client: 'Acme Inc.',
      date: 'May 7, 2025',
      carriers: ['Manulife', 'GSC'],
      status: [
        { carrier: 'Manulife', received: true },
        { carrier: 'GSC', received: false },
      ],
      waiting: 'Waiting on GSC',
      followUp: 'May 14, 2025',
      age: 12,
    },
    {
      id: 'Q-1003',
      client: 'Summit Healthcare',
      date: 'May 10, 2025',
      carriers: ['Blue Cross', 'GWL', 'Sun Life'],
      status: [
        { carrier: 'Blue Cross', received: false },
        { carrier: 'GWL', received: false },
        { carrier: 'Sun Life', received: true },
      ],
      waiting: 'Waiting on Blue Cross, GWL',
      followUp: 'May 17, 2025',
      age: 8,
    },
    {
      id: 'Q-1004',
      client: 'Meridian Manufacturing',
      date: 'May 15, 2025',
      carriers: ['Manulife', 'Blue Cross'],
      status: [
        { carrier: 'Manulife', received: false },
        { carrier: 'Blue Cross', received: false },
      ],
      waiting: 'Waiting on all carriers',
      followUp: 'May 22, 2025',
      age: 4,
    },
    {
      id: 'Q-1005',
      client: 'Quantum Software',
      date: 'May 18, 2025',
      carriers: ['Sun Life', 'GSC'],
      status: [
        { carrier: 'Sun Life', received: false },
        { carrier: 'GSC', received: false },
      ],
      waiting: 'Waiting on all carriers',
      followUp: 'Not yet followed up',
      age: 1,
    },
  ];

  // Filter quotes based on input
  const filteredQuotes = quotes.filter(
    (quote) =>
      quote.client.toLowerCase().includes(filterText.toLowerCase()) ||
      quote.id.toLowerCase().includes(filterText.toLowerCase())
  );

  // Count quotes waiting 10+ days
  const oldQuotes = quotes.filter(
    (quote) => quote.age >= 10 && quote.waiting !== 'Complete'
  ).length;

  // Helper function to determine badge color based on age
  const getAgeBadgeVariant = (age: number) => {
    if (age < 5) {
      return 'outline';
    }
    if (age < 10) {
      return 'secondary';
    }
    return 'destructive';
  };

  // Define columns for the sortable table
  const columns: ColumnConfig<Quote>[] = [
    {
      key: 'id',
      header: 'Quote ID',
      type: 'string',
    },
    {
      key: 'client',
      header: 'Client',
      type: 'string',
    },
    {
      key: 'date',
      header: 'Submitted',
      type: 'string',
    },
    {
      key: 'carriers',
      header: 'Carriers',
      type: 'string',
      render: (value: string[]) => value.join(', '),
    },
    {
      key: 'status',
      header: 'Response Status',
      type: 'string',
      render: (value: { carrier: string; received: boolean }[]) => (
        <div className="space-y-1">
          {value.map((status, index) => (
            <div key={index} className="flex items-center">
              {status.carrier}
              {status.received ? (
                <CheckCircle2 className="h-4 w-4 ml-1 text-green-500" />
              ) : (
                <Clock className="h-4 w-4 ml-1 text-amber-500" />
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'waiting',
      header: 'Waiting On',
      type: 'string',
      render: (value: string) => (
        value === 'Complete' ? (
          <Badge variant="outline">Complete</Badge>
        ) : (
          <Badge variant="default">{value}</Badge>
        )
      ),
    },
    {
      key: 'followUp',
      header: 'Last Follow Up',
      type: 'string',
    },
    {
      key: 'age',
      header: 'Age',
      type: 'number',
      render: (value: number) => (
        <Badge variant={getAgeBadgeVariant(value)}>
          {value} days
        </Badge>
      ),
    },
    {
      key: 'id', // Using id as key since we need actions per quote
      header: 'Actions',
      type: 'string',
      render: (value: string, quote: Quote) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Resend to Carrier</DropdownMenuItem>
            <DropdownMenuItem>Mark as Received</DropdownMenuItem>
            <DropdownMenuItem>Archive</DropdownMenuItem>
            <DropdownMenuItem>Add Internal Notes</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {oldQuotes > 0 && (
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Attention!</AlertTitle>
          <AlertDescription>
            {oldQuotes} quote{oldQuotes > 1 ? 's' : ''} waiting 10+ days.
          </AlertDescription>
        </Alert>
      )}
      {/* Quote Tracker Table */}
      <section aria-labelledby="quote-tracker-title">
        <h3
          id="quote-tracker-title"
          className="text-xl font-medium mb-2 sr-only"
        >
          Quote Tracker Table
        </h3>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client name or quote ID"
            className="pl-10"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>

        <SortableTable
          data={filteredQuotes}
          columns={columns}
          defaultSortKey="age"
          defaultSortDirection="desc"
        />
        {filteredQuotes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No quotes found matching your filter.
          </div>
        )}
      </section>
    </div>
  );
}
