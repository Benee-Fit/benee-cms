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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/design-system/components/ui/table';
import { cn } from '@repo/design-system/lib/utils';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Search,
} from 'lucide-react';
import { useState } from 'react';

interface OutstandingQuotesProps {
  className?: string;
}

export function OutstandingQuotes({ className }: OutstandingQuotesProps) {
  const [filterText, setFilterText] = useState('');

  // Mock data for quotes
  const quotes = [
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

  return (
    <div className={cn('space-y-6 p-6', className)}>
      <div>
        <h2 className="text-2xl font-semibold mb-1">Outstanding Quotes</h2>
        <p className="text-muted-foreground">
          All your in-progress quotes in one place.
        </p>
      </div>

      {/* Quote Tracker Table */}
      <section aria-labelledby="quote-tracker-title">
        <h3 id="quote-tracker-title" className="text-xl font-medium mb-2">
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

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Carriers</TableHead>
                  <TableHead>Response Status</TableHead>
                  <TableHead>Waiting On</TableHead>
                  <TableHead>Last Follow Up</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.id}</TableCell>
                    <TableCell>{quote.client}</TableCell>
                    <TableCell>{quote.date}</TableCell>
                    <TableCell>{quote.carriers.join(', ')}</TableCell>
                    <TableCell>
                      {quote.status.map((status, index) => (
                        <div key={index} className="flex items-center">
                          {status.carrier}
                          {status.received ? (
                            <CheckCircle2 className="h-4 w-4 ml-1 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 ml-1 text-amber-500" />
                          )}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>
                      {quote.waiting === 'Complete' ? (
                        <Badge variant="outline">Complete</Badge>
                      ) : (
                        <Badge variant="default">{quote.waiting}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{quote.followUp}</TableCell>
                    <TableCell>
                      <Badge variant={getAgeBadgeVariant(quote.age)}>
                        {quote.age} days
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                          <DropdownMenuItem>
                            Add Internal Notes
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredQuotes.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-4 text-muted-foreground"
                    >
                      No quotes found matching your filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {oldQuotes > 0 && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Attention!</AlertTitle>
            <AlertDescription>
              {oldQuotes} quote{oldQuotes > 1 ? 's' : ''} waiting 10+ days.
            </AlertDescription>
          </Alert>
        )}
      </section>
    </div>
  );
}
