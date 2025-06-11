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
import { TrendingDown, TrendingUp, Check, X } from 'lucide-react';

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

interface AlternativeComparisonProps {
  currentDocuments: ParsedDocument[];
  alternativeDocuments: ParsedDocument[];
  selectedCoverageType: string | null;
}

interface ComparisonGroup {
  coverageType: string;
  currentCarrier: string;
  currentDetails: Coverage | null;
  alternatives: Array<{
    carrier: string;
    coverage: Coverage;
    priceDifference: number;
    percentageChange: number;
  }>;
}

export default function AlternativeComparison({ 
  currentDocuments, 
  alternativeDocuments,
  selectedCoverageType 
}: AlternativeComparisonProps) {
  if (currentDocuments.length === 0 || alternativeDocuments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          Both current and alternative documents are needed for comparison.
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

  // Extract all alternative coverages
  const alternativeCoverages = alternativeDocuments.flatMap(doc => 
    doc.coverages && Array.isArray(doc.coverages) ? 
      doc.coverages.filter(coverage => 
        coverage && coverage.coverageType && (!selectedCoverageType || coverage.coverageType === selectedCoverageType)
      ) : []
  );

  // Get all unique coverage types
  const allCoverageTypes = Array.from(new Set([
    ...currentCoverages.map(c => c.coverageType),
    ...alternativeCoverages.map(c => c.coverageType)
  ])).sort();

  // Build comparison groups by coverage type
  const comparisonGroups: ComparisonGroup[] = allCoverageTypes.map(coverageType => {
    // Get current coverage for this type
    const currentCoverage = currentCoverages.find(c => c.coverageType === coverageType) || null;
    const currentCarrier = currentCoverage?.carrierName || 'Unknown';
    
    // Get all alternative coverages for this type
    const alternatives = alternativeCoverages
      .filter(c => c.coverageType === coverageType)
      .map(altCoverage => {
        const currentPrice = currentCoverage?.monthlyPremium || 0;
        const alternativePrice = altCoverage.monthlyPremium || 0;
        const priceDifference = alternativePrice - currentPrice;
        const percentageChange = currentPrice > 0 
          ? (priceDifference / currentPrice) * 100 
          : 0;
        
        return {
          carrier: altCoverage.carrierName,
          coverage: altCoverage,
          priceDifference,
          percentageChange
        };
      });
    
    return {
      coverageType,
      currentCarrier,
      currentDetails: currentCoverage,
      alternatives
    };
  });

  // Calculate total summary for current plan
  const totalCurrentPremium = currentCoverages.reduce((sum, coverage) => 
    sum + (coverage.monthlyPremium || 0), 0
  );

  // Get unique alternative carriers
  const alternativeCarriers = Array.from(new Set(
    alternativeDocuments.map(doc => doc.metadata.carrierName)
  ));

  // Calculate total premium per alternative carrier
  const carrierTotals = alternativeCarriers.map(carrier => {
    const carrierCoverages = alternativeCoverages.filter(c => c.carrierName === carrier);
    const totalPremium = carrierCoverages.reduce((sum, coverage) => 
      sum + (coverage.monthlyPremium || 0), 0
    );
    const priceDifference = totalPremium - totalCurrentPremium;
    const percentageChange = totalCurrentPremium > 0 
      ? (priceDifference / totalCurrentPremium) * 100 
      : 0;
    
    return {
      carrier,
      totalPremium,
      priceDifference,
      percentageChange
    };
  });

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
          <CardTitle>Alternative Plan Comparison</CardTitle>
          <CardDescription>
            Compare your current plan with alternative options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Current Plan Summary */}
            <div className="bg-muted/30 p-4 rounded-md">
              <div className="text-sm font-medium mb-2">Current Plan</div>
              <div className="text-lg font-bold mb-1">{formatCurrency(totalCurrentPremium)}</div>
              <div className="text-xs text-muted-foreground">Monthly Premium</div>
            </div>
            
            {/* Alternative Carrier Summary */}
            {carrierTotals.map((carrierTotal, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-md ${
                  carrierTotal.priceDifference < 0 ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                <div className="text-sm font-medium mb-2">{carrierTotal.carrier}</div>
                <div className="text-lg font-bold mb-1">
                  {formatCurrency(carrierTotal.totalPremium)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Monthly Premium</div>
                  <Badge variant={carrierTotal.priceDifference < 0 ? "secondary" : "destructive"}>
                    {carrierTotal.percentageChange.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center text-sm mt-2">
                  {carrierTotal.priceDifference < 0 
                    ? <TrendingDown className="mr-1 h-4 w-4 text-green-600" />
                    : <TrendingUp className="mr-1 h-4 w-4 text-red-600" />
                  }
                  <span className={
                    carrierTotal.priceDifference < 0 ? 'text-green-800' : 'text-red-800'
                  }>
                    {formatCurrency(Math.abs(carrierTotal.priceDifference))} {' '}
                    {carrierTotal.priceDifference < 0 ? 'Savings' : 'Increase'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Detailed Comparison Table */}
          <Table className="border">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Coverage Type</TableHead>
                <TableHead>Current Carrier</TableHead>
                <TableHead className="text-right">Current Premium</TableHead>
                {alternativeCarriers.map((carrier, idx) => (
                  <TableHead key={idx} className="text-right">{carrier}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonGroups.map((group, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{group.coverageType}</TableCell>
                  <TableCell>{group.currentCarrier}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(group.currentDetails?.monthlyPremium)}
                  </TableCell>
                  
                  {/* Alternative carrier columns */}
                  {alternativeCarriers.map((carrier, carrierIdx) => {
                    const alternative = group.alternatives.find(a => a.carrier === carrier);
                    return (
                      <TableCell key={carrierIdx} className="text-right">
                        {alternative ? (
                          <div className="font-mono">
                            {formatCurrency(alternative.coverage.monthlyPremium)}
                            <div className="text-xs flex items-center justify-end mt-1">
                              {alternative.priceDifference < 0 ? (
                                <span className="text-green-600 flex items-center">
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                  {alternative.percentageChange.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-red-600 flex items-center">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  {alternative.percentageChange.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
              
              {/* Total Row */}
              <TableRow className="font-bold bg-muted/20">
                <TableCell>TOTAL</TableCell>
                <TableCell>All Coverages</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(totalCurrentPremium)}
                </TableCell>
                
                {alternativeCarriers.map((carrier, idx) => {
                  const carrierTotal = carrierTotals.find(ct => ct.carrier === carrier);
                  return (
                    <TableCell key={idx} className="text-right font-mono">
                      {formatCurrency(carrierTotal?.totalPremium)}
                      {carrierTotal && (
                        <div className="text-xs flex items-center justify-end mt-1">
                          {carrierTotal.priceDifference < 0 ? (
                            <span className="text-green-600 flex items-center">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              {carrierTotal.percentageChange.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {carrierTotal.percentageChange.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Feature Comparison Cards */}
      {comparisonGroups.map((group, idx) => (
        <Card key={idx} className="shadow-sm">
          <CardHeader>
            <CardTitle>{group.coverageType} - Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {group.currentDetails && group.alternatives.length > 0 && (
              <Table className="border">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Feature</TableHead>
                    <TableHead>{group.currentCarrier} (Current)</TableHead>
                    {group.alternatives.map((alt, altIdx) => (
                      <TableHead key={altIdx}>{alt.carrier}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Premium Row */}
                  <TableRow>
                    <TableCell className="font-medium">Monthly Premium</TableCell>
                    <TableCell>{formatCurrency(group.currentDetails.monthlyPremium)}</TableCell>
                    {group.alternatives.map((alt, altIdx) => (
                      <TableCell key={altIdx} className={
                        alt.priceDifference < 0 ? 'text-green-700' : 'text-red-700'
                      }>
                        {formatCurrency(alt.coverage.monthlyPremium)}
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  {/* Unit Rate Row */}
                  <TableRow>
                    <TableCell className="font-medium">Unit Rate</TableCell>
                    <TableCell>
                      {group.currentDetails.unitRate?.toFixed(4)} {group.currentDetails.unitRateBasis}
                    </TableCell>
                    {group.alternatives.map((alt, altIdx) => (
                      <TableCell key={altIdx}>
                        {alt.coverage.unitRate?.toFixed(4)} {alt.coverage.unitRateBasis}
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  {/* Benefit Detail Comparison Rows */}
                  {group.currentDetails && Object.keys(group.currentDetails.benefitDetails || {}).map((key) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{key}</TableCell>
                      <TableCell>
                        {renderFeatureValue(group.currentDetails?.benefitDetails[key])}
                      </TableCell>
                      {group.alternatives.map((alt, altIdx) => (
                        <TableCell key={altIdx}>
                          {renderFeatureValue(alt.coverage.benefitDetails[key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {(!group.currentDetails || group.alternatives.length === 0) && (
              <div className="text-center py-6">
                <p className="text-muted-foreground">
                  Insufficient data for feature comparison in this coverage type.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Helper function to render different types of feature values
function renderFeatureValue(value: any) {
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground">N/A</span>;
  }
  
  if (typeof value === 'boolean') {
    return value ? 
      <Check className="h-4 w-4 text-green-600" /> : 
      <X className="h-4 w-4 text-red-600" />;
  }
  
  if (typeof value === 'number') {
    // If it looks like a currency value (larger than 1)
    if (value >= 1) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(value);
    } else {
      // Likely a percentage or small number
      return value.toString();
    }
  }
  
  return String(value);
}
