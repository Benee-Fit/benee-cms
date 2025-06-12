'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/design-system/components/ui/dialog';
import type { BrokerDetails } from './broker-data';
import { QuotesTable } from './quotes-table';

interface BrokerDetailsModalProps {
  broker: BrokerDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BrokerDetailsModal({
  broker,
  isOpen,
  onClose,
}: BrokerDetailsModalProps) {
  if (!broker) return null;

  const wonQuotes = broker.quotes.filter((q) => q.status === 'Won').length;
  const totalQuotes = broker.quotes.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!max-w-[90vw] !w-[90vw] max-h-[90vh] overflow-hidden flex flex-col"
        style={{ maxWidth: '90vw', width: '90vw' }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {broker.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Headcount
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl font-bold">{broker.avgHeadcount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top Industry
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl font-bold">{broker.topIndustry}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top Quote Source
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-lg font-bold">{broker.topQuoteSource}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Close Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl font-bold">{broker.closeRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {wonQuotes} of {totalQuotes} quotes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quotes Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quote History</h3>
            <QuotesTable quotes={broker.quotes} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
