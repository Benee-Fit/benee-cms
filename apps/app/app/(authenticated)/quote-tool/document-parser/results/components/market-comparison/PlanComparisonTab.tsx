import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import type { ParsedDocument, Coverage } from '../../../types';
import { cn } from '@repo/design-system/lib/utils';
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
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@repo/design-system/components/ui/accordion';
import { Button } from '@repo/design-system/components/ui/button';
import { Badge } from '@repo/design-system/components/ui/badge';
import { ChevronRight, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { Input } from '@repo/design-system/components/ui/input';

// Using shared ParsedDocument type from types.ts

interface PlanComparisonTabProps {
  results: ParsedDocument[];
}

// Type for benefit details which can be string, number, boolean, or nested object with those types
type BenefitDetail = string | number | boolean | null | { [key: string]: BenefitDetail };

// DetailRenderer component for clean data presentation with better text wrapping
const DetailRenderer = ({ details }: { details: BenefitDetail }) => {
  if (!details || typeof details !== 'object') {
    return <p className="text-sm break-words whitespace-normal leading-relaxed">{details || '-'}</p>;
  }
  return (
    <ul className="space-y-2">
      {Object.entries(details).map(([key, value]) => (
        <li key={key} className="text-sm">
          <span className="font-semibold text-foreground capitalize break-words">
            {key.replace(/([A-Z])/g, ' $1')}:
          </span>
          <span className="ml-2 text-muted-foreground break-words">
            {value || '-'}
          </span>
        </li>
      ))}
    </ul>
  );
};

// Helper function to extract and organize benefit data from both old and new formats
const extractFlexibleBenefitData = (documents: ParsedDocument[]): Record<string, Record<string, any>> => {
  const benefitData: Record<string, Record<string, any>> = {};
  
  for (const doc of documents) {
    // Try to get carrier name from multiple sources, prioritizing the most reliable
    let carrierName = 'Unknown Carrier';
    
    // Check processedData.metadata first (most reliable for new format)
    if ((doc as any).processedData?.metadata?.carrierName) {
      carrierName = (doc as any).processedData.metadata.carrierName;
    }
    // Check root metadata second
    else if (doc.metadata?.carrierName) {
      carrierName = doc.metadata.carrierName;
    }
    // Check first coverage in processedData.allCoverages
    else if ((doc as any).processedData?.allCoverages?.[0]?.carrierName) {
      carrierName = (doc as any).processedData.allCoverages[0].carrierName;
    }
    // Check first coverage in root allCoverages
    else if ((doc as any).allCoverages?.[0]?.carrierName) {
      carrierName = (doc as any).allCoverages[0].carrierName;
    }
    // Check first coverage in old format
    else if (doc.coverages?.[0]?.carrierName) {
      carrierName = doc.coverages[0].carrierName;
    }
    
    // Check for new format data in processedData.allCoverages
    if ((doc as any).processedData?.allCoverages) {
      const coverages = (doc as any).processedData.allCoverages;
      
      for (const coverage of coverages) {
        if (!coverage.coverageType) continue;
        
        const key = `${carrierName}-${coverage.planOptionName || 'Default'}-${coverage.coverageType}`;
        benefitData[key] = {
          carrierName: coverage.carrierName || carrierName,
          planOptionName: coverage.planOptionName || 'Default',
          coverageType: coverage.coverageType,
          monthlyPremium: coverage.monthlyPremium,
          unitRate: coverage.unitRate,
          unitRateBasis: coverage.unitRateBasis,
          volume: coverage.volume,
          lives: coverage.lives,
          livesSingle: coverage.livesSingle,
          livesFamily: coverage.livesFamily,
          premiumPerSingle: coverage.premiumPerSingle,
          premiumPerFamily: coverage.premiumPerFamily,
          ...coverage.benefitDetails
        };
      }
    }
    // Check for new format data directly in allCoverages (at root level)
    else if ((doc as any).allCoverages) {
      const coverages = (doc as any).allCoverages;
      
      for (const coverage of coverages) {
        if (!coverage.coverageType) continue;
        
        const key = `${carrierName}-${coverage.planOptionName || 'Default'}-${coverage.coverageType}`;
        benefitData[key] = {
          carrierName: coverage.carrierName || carrierName,
          planOptionName: coverage.planOptionName || 'Default',
          coverageType: coverage.coverageType,
          monthlyPremium: coverage.monthlyPremium,
          unitRate: coverage.unitRate,
          unitRateBasis: coverage.unitRateBasis,
          volume: coverage.volume,
          lives: coverage.lives,
          livesSingle: coverage.livesSingle,
          livesFamily: coverage.livesFamily,
          premiumPerSingle: coverage.premiumPerSingle,
          premiumPerFamily: coverage.premiumPerFamily,
          ...coverage.benefitDetails
        };
      }
    }
    // Fallback to old format
    else if (doc.coverages && doc.coverages.length > 0) {
      for (const coverage of doc.coverages) {
        if (!coverage.coverageType) continue;
        
        const key = `${carrierName}-${coverage.planOptionName || 'Default'}-${coverage.coverageType}`;
        benefitData[key] = {
          carrierName,
          planOptionName: coverage.planOptionName || 'Default',
          coverageType: coverage.coverageType,
          monthlyPremium: coverage.monthlyPremium,
          unitRate: coverage.unitRate,
          unitRateBasis: coverage.unitRateBasis,
          volume: coverage.volume,
          lives: coverage.lives,
          ...coverage.benefitDetails
        };
      }
    }
  }
  
  return benefitData;
};

// Helper function to get all unique benefit fields across all coverages
const getAllBenefitFields = (benefitData: Record<string, Record<string, any>>): string[] => {
  const allFields = new Set<string>();
  const excludeFields = new Set(['carrierName', 'planOptionName', 'coverageType']);
  
  Object.values(benefitData).forEach(coverage => {
    Object.keys(coverage).forEach(key => {
      if (!excludeFields.has(key) && coverage[key] !== null && coverage[key] !== undefined && coverage[key] !== '') {
        allFields.add(key);
      }
    });
  });
  
  return Array.from(allFields).sort();
};

// Helper function to format field names for display
const formatFieldName = (fieldName: string): string => {
  const fieldMappings: Record<string, string> = {
    'monthlyPremium': 'Monthly Premium',
    'unitRate': 'Unit Rate',
    'unitRateBasis': 'Rate Basis',
    'volume': 'Volume',
    'lives': 'Lives',
    'livesSingle': 'Single Lives',
    'livesFamily': 'Family Lives',
    'premiumPerSingle': 'Premium Per Single',
    'premiumPerFamily': 'Premium Per Family',
    'benefitAmount': 'Benefit Amount',
    'nonEvidenceMax': 'Non-Evidence Max',
    'reductionFormula': 'Reduction Formula',
    'terminationAge': 'Termination Age',
    'spouseAmount': 'Spouse Amount',
    'childAmount': 'Child Amount',
    'deductible': 'Deductible',
    'coinsurance': 'Coinsurance',
    'lifetimeMaximum': 'Lifetime Maximum',
    'drugPlan': 'Drug Plan',
    'paramedicalCoverage': 'Paramedical Coverage',
    'hospital': 'Hospital Coverage',
    'annualMaximum': 'Annual Maximum',
    'feeGuide': 'Fee Guide',
    'recallFrequency': 'Recall Frequency',
    'basicCoinsurance': 'Basic Coinsurance',
    'majorCoinsurance': 'Major Coinsurance',
    'orthoCoinsurance': 'Ortho Coinsurance'
  };
  
  return fieldMappings[fieldName] || fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

const PlanComparisonTab: FC<PlanComparisonTabProps> = ({ results = [] }) => {
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlanOptions, setSelectedPlanOptions] = useState<Record<string, string>>({});
  
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No data available for plan comparison.</p>
      </div>
    );
  }

  // Extract all benefit data using flexible approach
  const allBenefitData = extractFlexibleBenefitData(results);
  
  // Get unique coverage types
  const coverageTypes = Array.from(new Set(
    Object.values(allBenefitData).map(item => item.coverageType)
  )).sort();
  
  // Get unique carriers and their plan options
  const carriersWithPlans = results.reduce((acc, result) => {
    // Try to get carrier name from multiple sources, prioritizing the most reliable
    let carrierName = 'Unknown Carrier';
    
    // Check processedData.metadata first (most reliable for new format)
    if ((result as any).processedData?.metadata?.carrierName) {
      carrierName = (result as any).processedData.metadata.carrierName;
    }
    // Check root metadata second
    else if (result.metadata?.carrierName) {
      carrierName = result.metadata.carrierName;
    }
    // Check first coverage in processedData.allCoverages
    else if ((result as any).processedData?.allCoverages?.[0]?.carrierName) {
      carrierName = (result as any).processedData.allCoverages[0].carrierName;
    }
    // Check first coverage in root allCoverages
    else if ((result as any).allCoverages?.[0]?.carrierName) {
      carrierName = (result as any).allCoverages[0].carrierName;
    }
    // Check first coverage in old format
    else if (result.coverages?.[0]?.carrierName) {
      carrierName = result.coverages[0].carrierName;
    }
    if (!acc[carrierName]) {
      acc[carrierName] = new Set();
    }
    
    // Check for new format plan options in processedData.allCoverages
    if ((result as any).processedData?.allCoverages) {
      (result as any).processedData.allCoverages.forEach((coverage: any) => {
        if (coverage.planOptionName) {
          acc[carrierName].add(coverage.planOptionName);
        }
      });
    }
    // Check for new format plan options at root level
    else if ((result as any).allCoverages) {
      (result as any).allCoverages.forEach((coverage: any) => {
        if (coverage.planOptionName) {
          acc[carrierName].add(coverage.planOptionName);
        }
      });
    }
    // Fallback to old format
    else if (result.coverages && result.coverages.length > 0) {
      result.coverages.forEach(coverage => {
        if (coverage.planOptionName) {
          acc[carrierName].add(coverage.planOptionName);
        }
      });
    }
    
    return acc;
  }, {} as Record<string, Set<string>>);
  
  // Convert to array format and set defaults
  const carriers = Object.entries(carriersWithPlans).map(([carrierName, planOptionsSet]) => {
    const planOptions = Array.from(planOptionsSet);
    const defaultPlan = planOptions[0] || 'Default';
    
    // Set default plan option if not already set
    if (!selectedPlanOptions[carrierName] && planOptions.length > 0) {
      setSelectedPlanOptions(prev => ({ ...prev, [carrierName]: defaultPlan }));
    }
    
    return {
      id: Math.random().toString(36).substring(2, 9),
      name: carrierName,
      planOptions
    };
  });
  
  // Function to get benefit data for a specific carrier and plan option
  const getBenefitDataForCarrierPlan = (carrierName: string, planOption: string, coverageType: string) => {
    const key = `${carrierName}-${planOption}-${coverageType}`;
    return allBenefitData[key] || {};
  };
  
  // Get all unique benefit fields across all data
  const allBenefitFields = getAllBenefitFields(allBenefitData);

  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex justify-between items-center">
          <CardTitle>Plan Comparison</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8 h-8 w-[200px]"
                placeholder="Search plan details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-2"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {/* Display by Coverage Type */}
        {coverageTypes.map((coverageType) => (
          <div key={coverageType} className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
              {coverageType}
            </h3>
            
            {/* Plan Option Selectors */}
            {carriers.some(carrier => carrier.planOptions.length > 1) && (
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {carriers.map((carrier) => {
                  if (carrier.planOptions.length <= 1) return null;
                  
                  return (
                    <div key={carrier.name} className="flex flex-col space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        {carrier.name} Plan Option
                      </label>
                      <select
                        value={selectedPlanOptions[carrier.name] || carrier.planOptions[0]}
                        onChange={(e) => setSelectedPlanOptions(prev => ({ ...prev, [carrier.name]: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      >
                        {carrier.planOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Benefit Comparison Table */}
            <div className="overflow-x-auto">
              <Table className="table-auto w-full [&_tr:nth-child(even)]:bg-muted/30">
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 border-r border-b-2 border-b-sky-500">
                      <div className="font-semibold">Benefit Detail</div>
                    </TableHead>
                    {carriers.map((carrier, index) => (
                      <TableHead key={carrier.id} className={`min-w-[250px] max-w-[350px] border-b-2 border-b-sky-500 ${index % 2 === 1 ? 'bg-slate-100' : ''}`}>
                        <div className="flex flex-col items-center justify-center gap-1.5 p-2">
                          <div className="font-semibold text-sm text-center text-sky-600">{carrier.name}</div>
                          {carrier.planOptions.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {selectedPlanOptions[carrier.name] || carrier.planOptions[0]}
                            </Badge>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allBenefitFields
                    .filter(field => {
                      // Only show fields that have data for this coverage type
                      return carriers.some(carrier => {
                        const planOption = selectedPlanOptions[carrier.name] || carrier.planOptions[0] || 'Default';
                        const data = getBenefitDataForCarrierPlan(carrier.name, planOption, coverageType);
                        return data[field] !== undefined && data[field] !== null && data[field] !== '';
                      });
                    })
                    .filter(field => {
                      // Search filter
                      if (!searchQuery) return true;
                      const query = searchQuery.toLowerCase();
                      
                      // Check field name
                      if (formatFieldName(field).toLowerCase().includes(query)) return true;
                      
                      // Check field values
                      return carriers.some(carrier => {
                        const planOption = selectedPlanOptions[carrier.name] || carrier.planOptions[0] || 'Default';
                        const data = getBenefitDataForCarrierPlan(carrier.name, planOption, coverageType);
                        const value = data[field];
                        return value && String(value).toLowerCase().includes(query);
                      });
                    })
                    .map((field) => (
                      <TableRow key={field}>
                        <TableCell className="sticky left-0 bg-background z-10 border-r font-medium">
                          <div className="text-sm break-words whitespace-normal leading-relaxed">
                            {formatFieldName(field)}
                          </div>
                        </TableCell>
                        {carriers.map((carrier, index) => {
                          const planOption = selectedPlanOptions[carrier.name] || carrier.planOptions[0] || 'Default';
                          const data = getBenefitDataForCarrierPlan(carrier.name, planOption, coverageType);
                          const fieldValue = data[field];
                          
                          return (
                            <TableCell key={index} className={`align-top p-4 min-w-[250px] max-w-[350px] overflow-hidden transition-colors duration-200 ${index % 2 === 1 ? 'bg-slate-100 hover:bg-sky-50/50' : 'hover:bg-sky-50/50'}`}>
                              <div className="break-words whitespace-normal">
                                <DetailRenderer 
                                  details={fieldValue === true ? 'Yes' :
                                         fieldValue === false ? 'No' :
                                         fieldValue}
                                />
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PlanComparisonTab;