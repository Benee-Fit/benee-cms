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
import { TrendingDown, TrendingUp } from 'lucide-react';

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

interface RenegotiatedComparisonProps {
  currentDocuments: ParsedDocument[];
  renegotiatedDocuments: ParsedDocument[];
  selectedCoverageType: string | null;
}

interface ComparisonItem {
  coverageType: string;
  current: Coverage | null;
  renegotiated: Coverage | null;
  priceDifference: number;
  percentageChange: number;
}

export default function RenegotiatedComparison({ 
  currentDocuments, 
  renegotiatedDocuments,
  selectedCoverageType 
}: RenegotiatedComparisonProps) {
  if (currentDocuments.length === 0 || renegotiatedDocuments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          Both current and renegotiated documents are needed for comparison.
        </p>
      </div>
    );
  }

  // Extract all current coverages
  const currentCoverages = currentDocuments.flatMap(doc => 
    doc.coverages && Array.isArray(doc.coverages) ? 
      doc.coverages.filter(coverage => 
        coverage && coverage.coverageType && (!selectedCoverageType || coverage.coverageType === selectedCoverageType)
      ) : []
  );

  // Extract all renegotiated coverages
  const renegotiatedCoverages = renegotiatedDocuments.flatMap(doc => 
    doc.coverages && Array.isArray(doc.coverages) ? 
      doc.coverages.filter(coverage => 
        coverage && coverage.coverageType && (!selectedCoverageType || coverage.coverageType === selectedCoverageType)
      ) : []
  );

  // Get all unique coverage types
  const allCoverageTypes = Array.from(new Set([
    ...currentCoverages.map(c => c.coverageType),
    ...renegotiatedCoverages.map(c => c.coverageType)
  ])).sort();

  // Build comparison data
  const comparisonData: ComparisonItem[] = allCoverageTypes.map(coverageType => {
    // Find matching coverages from current and renegotiated
    const currentCoverage = currentCoverages.find(c => c.coverageType === coverageType) || null;
    const renegotiatedCoverage = renegotiatedCoverages.find(c => c.coverageType === coverageType) || null;
    
    // Calculate price difference and percentage change
    const currentPrice = currentCoverage?.monthlyPremium || 0;
    const renegotiatedPrice = renegotiatedCoverage?.monthlyPremium || 0;
    const priceDifference = renegotiatedPrice - currentPrice;
    const percentageChange = currentPrice > 0 
      ? (priceDifference / currentPrice) * 100 
      : 0;
    
    return {
      coverageType,
      current: currentCoverage,
      renegotiated: renegotiatedCoverage,
      priceDifference,
      percentageChange
    };
  });

  // Calculate total summary
  const totalCurrentPremium = currentCoverages.reduce((sum, coverage) => sum + (coverage.monthlyPremium || 0), 0);
  const totalRenegotiatedPremium = renegotiatedCoverages.reduce((sum, coverage) => sum + (coverage.monthlyPremium || 0), 0);
  const totalDifference = totalRenegotiatedPremium - totalCurrentPremium;
  const totalPercentageChange = totalCurrentPremium > 0 
    ? (totalDifference / totalCurrentPremium) * 100 
    : 0;

  // Format currency values
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Renegotiation Summary</CardTitle>
          <CardDescription>
            Comparison between current and renegotiated plan terms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-muted/30 p-4 rounded-md text-center">
              <div className="text-sm text-muted-foreground mb-1">Current Plan</div>
              <div className="text-xl font-bold">{formatCurrency(totalCurrentPremium)}</div>
              <div className="text-xs text-muted-foreground">Monthly Premium</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-md text-center">
              <div className="text-sm text-muted-foreground mb-1">Renegotiated Plan</div>
              <div className="text-xl font-bold">{formatCurrency(totalRenegotiatedPremium)}</div>
              <div className="text-xs text-muted-foreground">Monthly Premium</div>
            </div>
            <div className={`p-4 rounded-md text-center ${
              totalDifference < 0 ? 'bg-green-100' : totalDifference > 0 ? 'bg-red-100' : 'bg-muted/30'
            }`}>
              <div className="text-sm text-muted-foreground mb-1">Overall Impact</div>
              <div className="text-xl font-bold flex items-center justify-center">
                {totalDifference < 0 && <TrendingDown className="mr-1 h-5 w-5 text-green-600" />}
                {totalDifference > 0 && <TrendingUp className="mr-1 h-5 w-5 text-red-600" />}
                {formatCurrency(Math.abs(totalDifference))}
              </div>
              <div className="text-sm font-medium">
                {totalPercentageChange.toFixed(2)}% {totalDifference < 0 ? 'Decrease' : 'Increase'}
              </div>
            </div>
          </div>
          
          {/* Detailed Comparison Table */}
          <Table className="border">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Coverage Type</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">Renegotiated</TableHead>
                <TableHead className="text-right">Difference</TableHead>
                <TableHead className="text-right">% Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonData.map((item, idx) => (
                <TableRow key={idx} className={
                  item.priceDifference < 0 ? 'bg-green-50' : 
                  item.priceDifference > 0 ? 'bg-red-50' : ''
                }>
                  <TableCell className="font-medium">{item.coverageType}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.current?.monthlyPremium)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.renegotiated?.monthlyPremium)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <div className="flex items-center justify-end">
                      {item.priceDifference < 0 && (
                        <TrendingDown className="mr-1 h-4 w-4 text-green-600" />
                      )}
                      {item.priceDifference > 0 && (
                        <TrendingUp className="mr-1 h-4 w-4 text-red-600" />
                      )}
                      {formatCurrency(Math.abs(item.priceDifference))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={
                      item.percentageChange < 0 ? "default" : 
                      item.percentageChange > 0 ? "destructive" : "outline"
                    } className={item.percentageChange < 0 ? "bg-green-500 hover:bg-green-600" : ""}>
                      {item.percentageChange.toFixed(2)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {/* Total Row */}
              <TableRow className="font-bold bg-muted/20">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(totalCurrentPremium)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(totalRenegotiatedPremium)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  <div className="flex items-center justify-end">
                    {totalDifference < 0 && (
                      <TrendingDown className="mr-1 h-4 w-4 text-green-600" />
                    )}
                    {totalDifference > 0 && (
                      <TrendingUp className="mr-1 h-4 w-4 text-red-600" />
                    )}
                    {formatCurrency(Math.abs(totalDifference))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={
                    totalPercentageChange < 0 ? "default" : 
                    totalPercentageChange > 0 ? "destructive" : "outline"
                  } className={totalPercentageChange < 0 ? "bg-green-500 hover:bg-green-600" : ""}>
                    {totalPercentageChange.toFixed(2)}%
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Coverage Details Cards (one per coverage type) */}
      {comparisonData.map((item, idx) => (
        <Card key={idx} className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span>{item.coverageType}</span>
              <Badge 
                variant={
                  item.priceDifference < 0 ? "default" : 
                  item.priceDifference > 0 ? "destructive" : "outline"
                } 
                className={`ml-2 ${item.priceDifference < 0 ? "bg-green-500 hover:bg-green-600" : ""}`}
              >
                {item.percentageChange.toFixed(2)}% {item.priceDifference < 0 ? 'Decrease' : 'Increase'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Coverage */}
              <div>
                <h3 className="font-medium text-sm mb-2">Current Plan</h3>
                <div className="bg-muted/30 p-3 rounded-md">
                  {item.current ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <span className="text-muted-foreground">Monthly Premium:</span>
                      <span className="font-medium">{formatCurrency(item.current.monthlyPremium)}</span>
                      
                      <span className="text-muted-foreground">Unit Rate:</span>
                      <span>{item.current.unitRate?.toFixed(4)} {item.current.unitRateBasis}</span>
                      
                      <span className="text-muted-foreground">Volume:</span>
                      <span>{new Intl.NumberFormat('en-US').format(item.current.volume)}</span>
                      
                      <span className="text-muted-foreground">Lives:</span>
                      <span>{item.current.lives}</span>
                      
                      {/* First few benefit details */}
                      {Object.entries(item.current.benefitDetails || {}).slice(0, 4).map(([key, value]) => (
                        <React.Fragment key={key}>
                          <span className="text-muted-foreground">{key}:</span>
                          <span>{String(value)}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground text-sm py-2">
                      No current plan data available
                    </p>
                  )}
                </div>
              </div>
              
              {/* Renegotiated Coverage */}
              <div>
                <h3 className="font-medium text-sm mb-2">Renegotiated Plan</h3>
                <div className="bg-muted/30 p-3 rounded-md">
                  {item.renegotiated ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <span className="text-muted-foreground">Monthly Premium:</span>
                      <span className="font-medium">{formatCurrency(item.renegotiated.monthlyPremium)}</span>
                      
                      <span className="text-muted-foreground">Unit Rate:</span>
                      <span>{item.renegotiated.unitRate?.toFixed(4)} {item.renegotiated.unitRateBasis}</span>
                      
                      <span className="text-muted-foreground">Volume:</span>
                      <span>{new Intl.NumberFormat('en-US').format(item.renegotiated.volume)}</span>
                      
                      <span className="text-muted-foreground">Lives:</span>
                      <span>{item.renegotiated.lives}</span>
                      
                      {/* First few benefit details */}
                      {Object.entries(item.renegotiated.benefitDetails || {}).slice(0, 4).map(([key, value]) => (
                        <React.Fragment key={key}>
                          <span className="text-muted-foreground">{key}:</span>
                          <span>{String(value)}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground text-sm py-2">
                      No renegotiated plan data available
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
