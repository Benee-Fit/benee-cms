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
import { Alert, AlertDescription } from '@repo/design-system/components/ui/alert';
import { 
  AlertTriangle, 
  Calendar, 
  FileText, 
  DollarSign, 
  Users, 
  BarChart3, 
  Info,
  TrendingUp,
  Shield
} from 'lucide-react';

// Import types from the centralized types file
import type { ParsedDocument, Coverage } from '../../types';

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
  // Add a loading state check
  if (!documents) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="text-gray-500">Loading carrier details...</div>
      </div>
    );
  }

  if (!carrierName || documents.length === 0) {
    return (
      <Alert className="mx-auto max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No data available for the selected carrier. Please ensure documents have been uploaded and processed.
        </AlertDescription>
      </Alert>
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
      doc.planNotes?.map(note => note.note) || []
    ))
  );

  // Format currency values
  const formatCurrency = (value: number | string | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(numValue);
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

  // Format unit rate with proper handling
  const formatUnitRate = (value: number | string | null | undefined, basis: string | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'N/A';
    const formattedValue = numValue.toFixed(4);
    return basis ? `${formattedValue} ${basis}` : formattedValue;
  };

  // Format volume with proper number formatting
  const formatVolume = (value: number | string | null | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'N/A';
    return new Intl.NumberFormat('en-US').format(numValue);
  };

  // Calculate total premium for all coverages
  const totalPremium = carrierCoverages.reduce((sum, coverage) => {
    const premium = typeof coverage.monthlyPremium === 'string' 
      ? parseFloat(coverage.monthlyPremium) 
      : coverage.monthlyPremium;
    return sum + (premium || 0);
  }, 0);

  // Group coverages by category for better organization
  const coverageCategories = {
    'Life & AD&D': ['Basic Life', 'AD&D', 'Dependent Life'],
    'Disability': ['Long Term Disability', 'Short Term Disability'],
    'Health': ['Extended Healthcare', 'Extended Health'],
    'Dental': ['Dental Care', 'Dental'],
    'Other': []
  };

  const categorizeCoverages = (coverages: Coverage[]) => {
    const categorized: Record<string, Coverage[]> = {
      'Life & AD&D': [],
      'Disability': [],
      'Health': [],
      'Dental': [],
      'Other': []
    };

    coverages.forEach(coverage => {
      let assigned = false;
      for (const [category, types] of Object.entries(coverageCategories)) {
        if (types.some(type => coverage.coverageType?.toLowerCase().includes(type.toLowerCase()))) {
          categorized[category].push(coverage);
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        categorized['Other'].push(coverage);
      }
    });

    // Remove empty categories
    return Object.fromEntries(
      Object.entries(categorized).filter(([_, coverages]) => coverages.length > 0)
    );
  };

  // Get document metadata
  const primaryDocument = carrierDocuments[0];
  const metadata = primaryDocument?.metadata;

  return (
    <div className="space-y-6">
      {/* Enhanced Carrier Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Key Metrics Cards */}
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 truncate">Total Premium</p>
                <p className="text-lg font-bold text-gray-900 truncate">{formatCurrency(totalPremium)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-green-100 rounded-lg flex-shrink-0">
                <BarChart3 className="h-4 w-4 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 truncate">Coverage Types</p>
                <p className="text-lg font-bold text-gray-900">{carrierCoverages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-purple-100 rounded-lg flex-shrink-0">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 truncate">Total Lives</p>
                <p className="text-lg font-bold text-gray-900">
                  {carrierCoverages.reduce((sum, cov) => sum + (cov.lives || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-orange-100 rounded-lg flex-shrink-0">
                <FileText className="h-4 w-4 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 truncate">Plan Options</p>
                <p className="text-lg font-bold text-gray-900">{Object.keys(coveragesByPlanOption).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Carrier Overview */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">{carrierName} Overview</CardTitle>
              <CardDescription>
                Comprehensive information for {carrierName} coverages and plan options
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="h-4 w-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-800">General Information</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Client:</span>
                  <span className="font-medium">{metadata?.clientName || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Carrier:</span>
                  <span className="font-medium">{metadata?.carrierName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Document Type:</span>
                  <span className="font-medium">{metadata?.documentType || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Policy Number:</span>
                  <span className="font-medium">{metadata?.policyNumber || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-800">Dates & Premiums</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-blue-200">
                  <span className="text-blue-700">Effective Date:</span>
                  <span className="font-medium text-blue-900">{formatDate(metadata?.effectiveDate)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-blue-200">
                  <span className="text-blue-700">Quote Date:</span>
                  <span className="font-medium text-blue-900">{formatDate(metadata?.quoteDate)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-blue-200">
                  <span className="text-blue-700">Monthly Premium:</span>
                  <span className="font-bold text-blue-900">{formatCurrency(metadata?.totalProposedMonthlyPlanPremium)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-blue-700">Rate Guarantees:</span>
                  <span className="font-medium text-blue-900">{metadata?.rateGuarantees || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Plan Options Summary */}
          {metadata?.planOptionTotals && metadata.planOptionTotals.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-semibold text-green-800">Plan Options Summary</h3>
              </div>
              <div className="bg-green-50 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="table-auto w-full">
                  <TableHeader>
                    <TableRow className="bg-green-100 border-b border-green-200">
                      <TableHead className="text-green-800 font-semibold w-auto">Plan Option</TableHead>
                      <TableHead className="text-right text-green-800 font-semibold w-auto min-w-[140px]">Monthly Premium</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metadata.planOptionTotals.map((option, idx) => (
                      <TableRow key={`option-${idx}`} className="hover:bg-green-100/50 transition-colors">
                        <TableCell className="font-medium text-green-900 w-auto">{option.planOptionName}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-green-900 w-auto">
                          {formatCurrency(option.totalMonthlyPremium)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Coverage Categories by Plan Option */}
      {Object.entries(coveragesByPlanOption).map(([planOption, coverages]) => {
        const categorizedCoverages = categorizeCoverages(coverages);
        const planPremium = coverages.reduce((sum, cov) => {
          const premium = typeof cov.monthlyPremium === 'string' 
            ? parseFloat(cov.monthlyPremium) 
            : cov.monthlyPremium;
          return sum + (premium || 0);
        }, 0);
        
        return (
          <Card key={planOption} className="shadow-sm border-l-4 border-l-teal-500">
            <CardHeader className="bg-teal-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Shield className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <span className="text-teal-900 text-lg">{planOption}</span>
                    <p className="text-sm text-teal-700 font-normal">Plan Option Details</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-white border-teal-300 text-teal-700">
                    {coverages.length} {coverages.length === 1 ? 'coverage' : 'coverages'}
                  </Badge>
                  <Badge variant="secondary" className="bg-teal-100 text-teal-800 font-bold">
                    {formatCurrency(planPremium)}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Coverage Categories */}
              {Object.entries(categorizedCoverages).map(([category, categoryCoverages]) => (
                <div key={category}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-teal-500 rounded-full mr-2"></span>
                    {category}
                    <Badge variant="outline" className="ml-2 text-xs">
                      {categoryCoverages.length} item{categoryCoverages.length !== 1 ? 's' : ''}
                    </Badge>
                  </h4>
                  <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                      <Table className="table-auto w-full min-w-max">
                      <TableHeader>
                        <TableRow className="bg-gray-100">
                          <TableHead className="font-semibold text-gray-800 w-auto">Coverage Type</TableHead>
                          <TableHead className="text-right font-semibold text-gray-800 w-auto min-w-[120px]">Monthly Premium</TableHead>
                          <TableHead className="text-right font-semibold text-gray-800 w-auto min-w-[100px]">Unit Rate</TableHead>
                          <TableHead className="text-right font-semibold text-gray-800 w-auto min-w-[80px]">Volume</TableHead>
                          <TableHead className="text-right font-semibold text-gray-800 w-auto min-w-[60px]">Lives</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoryCoverages.map((coverage, idx) => (
                          <TableRow key={idx} className="hover:bg-white transition-colors border-b border-gray-100 last:border-b-0">
                            <TableCell className="font-medium text-gray-900 w-auto">
                              {coverage.coverageType}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-green-700 w-auto">
                              {formatCurrency(coverage.monthlyPremium)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-gray-700 w-auto">
                              {formatUnitRate(coverage.unitRate, coverage.unitRateBasis)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-gray-700 w-auto">
                              {formatVolume(coverage.volume)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-gray-700 w-auto">
                              {coverage.lives || 0}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Coverage Details */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <Info className="h-4 w-4 mr-2 text-blue-600" />
                  Benefit Details
                </h4>
                <Accordion type="multiple" className="w-full space-y-2">
                  {coverages.map((coverage, idx) => (
                    <AccordionItem key={idx} value={`coverage-${idx}`} className="border border-gray-200 rounded-lg">
                      <AccordionTrigger className="text-sm px-4 py-3 hover:bg-gray-50 rounded-t-lg">
                        <div className="flex items-center justify-between w-full mr-4">
                          <span className="font-medium">{coverage.coverageType} Details</span>
                          <Badge variant="outline" className="text-xs">
                            {Object.keys(coverage.benefitDetails || {}).length} benefits
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                            {Object.entries(coverage.benefitDetails || {}).map(([key, value]) => (
                              <div key={key} className="flex flex-col space-y-1">
                                <span className="text-blue-700 font-medium capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </span>
                                <span className="text-blue-900 font-semibold bg-white px-2 py-1 rounded border border-blue-200">
                                  {String(value) || 'N/A'}
                                </span>
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
        );
      })}
      
      {/* Enhanced Plan Notes */}
      {planNotes.length > 0 && (
        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="bg-amber-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-amber-900">Plan Notes & Conditions</CardTitle>
                <CardDescription className="text-amber-700">
                  Important notes and conditions for {carrierName}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="bg-amber-25 pt-6">
            <div className="space-y-3">
              {planNotes.map((note, idx) => (
                <div key={idx} className="bg-white border border-amber-200 rounded-lg p-3 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700 leading-relaxed">{note}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}