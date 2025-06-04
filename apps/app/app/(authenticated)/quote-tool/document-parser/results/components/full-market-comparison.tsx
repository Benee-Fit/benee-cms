'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/design-system/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@repo/design-system/components/ui/accordion';
import { CheckCircle, XCircle } from 'lucide-react';

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

interface FullMarketComparisonProps {
  documents: ParsedDocument[];
  selectedCoverageType: string | null;
}

export default function FullMarketComparison({ documents, selectedCoverageType }: FullMarketComparisonProps) {
  // Debug information
  const hasDocuments = documents && documents.length > 0;
  const hasCoverages = hasDocuments && documents.some(doc => 
    doc.coverages && Array.isArray(doc.coverages) && doc.coverages.length > 0
  );
  const coverageCount = hasDocuments ? 
    documents.reduce((count, doc) => count + (doc.coverages?.length || 0), 0) : 0;

  // Group coverages by type, with improved defensive coding
  const coveragesByType = documents.reduce<Record<string, Coverage[]>>((acc, document) => {
    // Skip if document is null/undefined or doesn't have coverages
    if (!document || !document.coverages || !Array.isArray(document.coverages)) {
      return acc;
    }

    document.coverages.forEach(coverage => {
      // Make sure coverage is an object with required fields
      if (coverage && typeof coverage === 'object' && 'coverageType' in coverage) {
        const coverageType = coverage.coverageType;
        
        // Apply filter if selected
        if (coverageType && (!selectedCoverageType || coverageType === selectedCoverageType)) {
          if (!acc[coverageType]) {
            acc[coverageType] = [];
          }
          
          // Add normalized coverage object
          acc[coverageType].push({
            ...coverage,
            // Ensure carrierName has a value
            carrierName: coverage.carrierName || (document.metadata?.carrierName || 'Unknown Carrier')
          });
        }
      }
    });
    return acc;
  }, {});

  // Get unique carriers across all documents
  const uniqueCarriers = Array.from(
    new Set(documents.flatMap(doc => doc.metadata?.carrierName || 'Unknown Carrier').filter(Boolean))
  );

  // Sort carriers for consistent display
  uniqueCarriers.sort();

  if (Object.keys(coveragesByType).length === 0) {
    return (
      <div className="text-center py-8">
        <div className="space-y-4">
          <p className="text-gray-500">No coverage data available for the selected filter.</p>
          
          {/* Debugging information */}
          <div className="text-left bg-muted/30 p-4 rounded-md max-w-lg mx-auto text-sm">
            <h4 className="font-medium mb-2">Troubleshooting Information:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Documents found: {documents.length}</li>
              <li>Has coverages: {hasCoverages ? 'Yes' : 'No'}</li>
              <li>Total coverage items: {coverageCount}</li>
              {selectedCoverageType && (
                <li>Current filter: {selectedCoverageType}</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Format currency values
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Format numbers without currency
  const formatNumber = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="space-y-8">
      {Object.entries(coveragesByType).map(([coverageType, coverages]) => (
        <Card key={coverageType} className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span>{coverageType}</span>
              <Badge variant="outline" className="ml-2">
                {coverages.length} {coverages.length === 1 ? 'option' : 'options'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Compare {coverageType} coverage across all carriers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table className="border">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[180px]">Carrier / Option</TableHead>
                  <TableHead className="text-right">Monthly Premium</TableHead>
                  <TableHead className="text-right">Unit Rate</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">Lives</TableHead>
                  <TableHead className="text-center">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coverages.map((coverage, idx) => (
                  <TableRow key={`${coverage.carrierName}-${coverage.planOptionName}-${idx}`}>
                    <TableCell className="font-medium">
                      <div>{coverage.carrierName}</div>
                      <div className="text-xs text-muted-foreground">{coverage.planOptionName || 'Default'}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(coverage.monthlyPremium)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {coverage.unitRate?.toFixed(4)} {coverage.unitRateBasis}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(coverage.volume)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(coverage.lives)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value={`details-${idx}`} className="border-none">
                          <AccordionTrigger className="text-xs py-1">View Details</AccordionTrigger>
                          <AccordionContent>
                            <div className="text-xs bg-muted/30 p-3 rounded-md">
                              <h4 className="font-semibold mb-1">Benefit Details:</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                                {Object.entries(coverage.benefitDetails || {}).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="text-muted-foreground mr-2">{key}:</span>
                                    <span className="font-medium truncate">{
                                      value === true ? <CheckCircle className="h-3 w-3 text-green-500" /> :
                                      value === false ? <XCircle className="h-3 w-3 text-red-500" /> :
                                      String(value)
                                    }</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
