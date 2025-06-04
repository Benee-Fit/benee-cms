'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/design-system/components/ui/table';
import { Badge } from '@repo/design-system/components/ui/badge';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@repo/design-system/components/ui/accordion';

// Types
interface ParsedDocument {
  originalFileName: string;
  category: string;
  metadata: {
    documentType: string;
    clientName: string;
    carrierName: string;
    effectiveDate: string;
    quoteDate: string;
    policyNumber?: string;
    planOptionName?: string;
    totalProposedMonthlyPlanPremium?: number;
    fileName: string;
    fileCategory: string;
    planOptionTotals?: Array<{
      planOptionName: string;
      totalMonthlyPremium: number;
    }>;
    rateGuarantees?: string;
  };
  coverages: Array<Coverage>;
  planNotes: Array<{ note: string }>;
}

interface Coverage {
  coverageType: string;
  carrierName: string;
  planOptionName: string;
  premium: number;
  monthlyPremium: number;
  unitRate: number;
  unitRateBasis: string;
  volume: number;
  lives: number;
  benefitDetails: Record<string, any>;
}

interface SingleCarrierViewProps {
  documents: ParsedDocument[];
  selectedCoverageType: string | null;
  carrierName: string | null;
}

export default function SingleCarrierView({ 
  documents, 
  selectedCoverageType, 
  carrierName 
}: SingleCarrierViewProps) {
  if (!carrierName || documents.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No data available for the selected carrier.</p>
      </div>
    );
  }

  // Get carrier document(s) and plan options
  const carrierDocuments = documents.filter(doc => 
    doc.metadata && doc.metadata.carrierName === carrierName
  );

  // Get all coverages for this carrier, filtered by selected coverage type if needed
  const carrierCoverages = carrierDocuments.flatMap(doc => 
    doc.coverages && Array.isArray(doc.coverages) ? 
      doc.coverages.filter(coverage => 
        coverage && coverage.coverageType && (!selectedCoverageType || coverage.coverageType === selectedCoverageType)
      ) : []
  );

  // Group coverages by plan option
  const coveragesByPlanOption = carrierCoverages.reduce<Record<string, Coverage[]>>(
    (acc, coverage) => {
      const planOption = coverage.planOptionName || 'Default';
      if (!acc[planOption]) {
        acc[planOption] = [];
      }
      acc[planOption].push(coverage);
      return acc;
    }, 
    {}
  );

  // Get all unique plan notes across all carrier documents
  const planNotes = Array.from(
    new Set(carrierDocuments.flatMap(doc => 
      doc.planNotes.map(note => note.note)
    ))
  );

  // Format currency values
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Format dates
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Get document metadata
  const primaryDocument = carrierDocuments[0];
  const metadata = primaryDocument?.metadata;

  return (
    <div className="space-y-6">
      {/* Carrier Overview */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>{carrierName} Overview</CardTitle>
          <CardDescription>
            Detailed information for {carrierName} coverages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-sm font-medium">General Information</h3>
              <div className="grid grid-cols-2 gap-x-4 text-sm mt-2">
                <span className="text-muted-foreground">Client:</span>
                <span>{metadata?.clientName || 'N/A'}</span>
                
                <span className="text-muted-foreground">Carrier:</span>
                <span>{metadata?.carrierName}</span>
                
                <span className="text-muted-foreground">Document Type:</span>
                <span>{metadata?.documentType || 'N/A'}</span>
                
                <span className="text-muted-foreground">Policy Number:</span>
                <span>{metadata?.policyNumber || 'N/A'}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium">Dates & Premiums</h3>
              <div className="grid grid-cols-2 gap-x-4 text-sm mt-2">
                <span className="text-muted-foreground">Effective Date:</span>
                <span>{formatDate(metadata?.effectiveDate)}</span>
                
                <span className="text-muted-foreground">Quote Date:</span>
                <span>{formatDate(metadata?.quoteDate)}</span>
                
                <span className="text-muted-foreground">Total Monthly Premium:</span>
                <span className="font-medium">{
                  formatCurrency(metadata?.totalProposedMonthlyPlanPremium)
                }</span>
                
                <span className="text-muted-foreground">Rate Guarantees:</span>
                <span>{metadata?.rateGuarantees || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          {/* Plan Options Summary */}
          {metadata?.planOptionTotals && metadata.planOptionTotals.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Plan Options Summary</h3>
              <Table className="border">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Plan Option</TableHead>
                    <TableHead className="text-right">Monthly Premium</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metadata.planOptionTotals.map((option, idx) => (
                    <TableRow key={`option-${idx}`}>
                      <TableCell>{option.planOptionName}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(option.totalMonthlyPremium)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Plan Option Coverages */}
      {Object.entries(coveragesByPlanOption).map(([planOption, coverages]) => (
        <Card key={planOption} className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span>{planOption}</span>
              <Badge variant="outline" className="ml-2">
                {coverages.length} {coverages.length === 1 ? 'coverage' : 'coverages'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="border">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Coverage Type</TableHead>
                  <TableHead className="text-right">Monthly Premium</TableHead>
                  <TableHead className="text-right">Unit Rate</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">Lives</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coverages.map((coverage, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {coverage.coverageType}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(coverage.monthlyPremium)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {coverage.unitRate?.toFixed(4)} {coverage.unitRateBasis}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {new Intl.NumberFormat('en-US').format(coverage.volume)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {coverage.lives}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Coverage Details */}
            <div className="mt-4">
              <Accordion type="multiple" className="w-full">
                {coverages.map((coverage, idx) => (
                  <AccordionItem key={idx} value={`coverage-${idx}`}>
                    <AccordionTrigger className="text-sm">
                      {coverage.coverageType} Details
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="bg-muted/30 p-3 rounded-md">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          {Object.entries(coverage.benefitDetails || {}).map(([key, value]) => (
                            <div key={key} className="flex justify-between py-1 border-b border-muted">
                              <span className="text-muted-foreground mr-2">{key}:</span>
                              <span className="font-medium truncate">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Plan Notes */}
      {planNotes.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Plan Notes</CardTitle>
            <CardDescription>
              Important notes and conditions for this carrier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {planNotes.map((note, idx) => (
                <li key={idx} className="text-sm">{note}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
