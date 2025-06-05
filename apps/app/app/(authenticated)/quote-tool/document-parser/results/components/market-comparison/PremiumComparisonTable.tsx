import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/design-system/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/design-system/components/ui/table';
import React, { useState, useMemo } from 'react';

// Import ParsedDocumentResult type
import type { Coverage, ParsedDocumentResult } from '../../../types';

// Format number as currency
const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return '$0.00';
  }

  const numValue = typeof value === 'string' ? Number.parseFloat(value.replace(/,/g, '')) : value;

  if (Number.isNaN(numValue)) {
    return '$0.00';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

// Format coverage volume with appropriate units
const formatVolume = (volume: string | number | null | undefined): string => {
  if (!volume) {
    return '-';
  }
  if (volume === '{}' || typeof volume === 'object') {
    return '-';
  }
  
  // If volume is already a number, convert to string first
  const volumeStr = typeof volume === 'number' ? volume.toString() : volume;
  
  // Try to parse as number
  const numericVolume = Number.parseFloat(volumeStr.replace(/,/g, ''));
  
  // Return original string if could not parse
  if (Number.isNaN(numericVolume)) {
    return volumeStr;
  }
  
  // Format with commas for thousands
  return Number(numericVolume).toLocaleString();
};

// Map for normalizing coverage types
const coverageTypeMap: Record<string, string> = {
  'Basic Life': 'Basic Life',
  'AD&D': 'AD&D',
  'Accidental Death & Dismemberment': 'AD&D',
  'Accidental Death and Dismemberment': 'AD&D',
  'Dependent Life': 'Dependent Life',
  'Dep Life': 'Dependent Life',
  LTD: 'Long Term Disability',
  'Long Term Disability': 'Long Term Disability',
  STD: 'Short Term Disability',
  'Short Term Disability': 'Short Term Disability',
  'Extended Healthcare': 'Extended Healthcare',
  'Extended Health': 'Extended Healthcare',
  EHC: 'Extended Healthcare',
  'Dental Care': 'Dental Care',
  Dental: 'Dental Care',
  Vision: 'Vision Care',
  'Vision Care': 'Vision Care',
  'Critical Illness': 'Critical Illness',
  EAP: 'EAP',
  'Employee Assistance Program': 'EAP',
  'Health Spending Account': 'Health Spending Account',
  HSA: 'Health Spending Account',
};

// Group coverage types for subtotals
const pooledCoverageTypes = [
  'Basic Life',
  'AD&D',
  'Dependent Life',
  'Critical Illness',
];

const experienceCoverageTypes = [
  'Long Term Disability',
  'Short Term Disability',
  'Extended Healthcare',
  'Dental Care',
  'Vision Care',
  'EAP',
  'Health Spending Account',
];

// Keys for mapping benefit details for coverage types with single/family breakdowns
type DetailField = {
  premium: string;
  rate: string | null;
  volume: string | null;
};

type CoverageDetailKeys = {
  [coverage: string]: {
    [variant: string]: DetailField;
  };
};

const coverageDetailKeys: CoverageDetailKeys = {
  'Extended Healthcare': {
    'Single': {
      premium: 'totalPremiumSingle',
      rate: 'premiumPerSingle',
      volume: 'livesSingle'
    },
    'Family': {
      premium: 'totalPremiumFamily',
      rate: 'premiumPerFamily',
      volume: 'livesFamily'
    }
  },
  'Dental Care': {
    'Single': {
      premium: 'totalPremiumSingle',
      rate: 'premiumPerSingle',
      volume: 'livesSingle'
    },
    'Family': {
      premium: 'totalPremiumFamily',
      rate: 'premiumPerFamily',
      volume: 'livesFamily'
    }
  },
  'Health Spending Account': {
    'Single': {
      premium: 'totalContributionSingleMonthly',
      rate: 'contributionPerSingleMonthly',
      volume: 'livesSingle'
    },
    'Family': {
      premium: 'totalContributionFamilyMonthly',
      rate: 'contributionPerFamilyMonthly',
      volume: 'livesFamily'
    },
    'Admin Fee': {
      premium: 'adminFeeMonthly',
      rate: null,
      volume: null
    }
  }
};

// Component type definitions - removed unused types

type Metadata = {
  carrierName?: string;
  primaryCarrierName?: string | null;
  rateGuarantees?: string | string[] | null;
};

type BenefitDataValue = {
  volume: string;
  unitRate: string;
  monthlyPremium: string;
};

type BenefitDataItem = {
  isSubtotal?: boolean;
  isTotal?: boolean;
  isRateGuarantee?: boolean;
  values: BenefitDataValue[];
};

type BenefitDataMap = {
  [key: string]: BenefitDataItem;
};

interface PremiumComparisonTableProps {
  results: ParsedDocumentResult[];
}

/**
 * Premium Comparison Table Component
 * Displays a comparison of insurance premiums across different carriers and benefit types
 */
export function PremiumComparisonTable({
  results,
}: PremiumComparisonTableProps): React.ReactElement {
  // Initialize state for selected plan option and carriers
  const [selectedPlanOption, setSelectedPlanOption] = useState<string>('');

  // Extract all plan options from results for dropdown
  const planOptions = useMemo(() => {
    const options: Set<string> = new Set();

    for (const result of results) {
      if (result?.allCoverages) {
        for (const coverage of result.allCoverages) {
          if (coverage.planOptionName) {
            options.add(coverage.planOptionName);
          }
        }
      }
    }

    return Array.from(options);
  }, [results]);

  // Set default selected plan option when planOptions change
  useMemo(() => {
    if (planOptions.length > 0 && !selectedPlanOption) {
      setSelectedPlanOption(planOptions[0]);
    }
  }, [planOptions, selectedPlanOption]);

  // Extract carrier information from results
  const carriers = useMemo(() => {
    const carriersMap: Array<{ name: string; rateGuarantee?: string }> = [];

    for (const result of results) {
      const metadata = result.metadata;
      let carrierName = '';
      let rateGuaranteeText: string | undefined;

      // Try to get carrier name from metadata or plan options
      if (metadata?.primaryCarrierName) {
        carrierName = metadata.primaryCarrierName;
      } else if (metadata?.carrierName) {
        carrierName = metadata.carrierName;
      } else {
        // Look in plan options
        const allCoverages = result.allCoverages || [];
        const coverage = allCoverages.find((c: Coverage) => c.carrierName);
        if (coverage?.carrierName) {
          carrierName = coverage.carrierName;
        }
      }

      // Format carrier name to consistent case
      carrierName = carrierName.toUpperCase();

      // Look for rate guarantees
      if (result.planOptions && selectedPlanOption) {
        const planOption = result.planOptions.find(
          (po: { planOptionName: string; rateGuarantees?: string[] }) =>
            po.planOptionName === selectedPlanOption
        );

        // Add rateGuarantees from planOption if available
        if (selectedPlanOption && planOption && planOption.rateGuarantees && planOption.rateGuarantees.length > 0) {
          // Extract the first rate guarantee from planOption (we'll use just the first one for display)
          rateGuaranteeText = planOption.rateGuarantees[0];
        }
      } else if (metadata?.rateGuarantees) {
        if (
          Array.isArray(metadata.rateGuarantees) &&
          metadata.rateGuarantees.length > 0
        ) {
          rateGuaranteeText = metadata.rateGuarantees[0];
        } else if (typeof metadata.rateGuarantees === 'string') {
          rateGuaranteeText = metadata.rateGuarantees;
        }
      }

      // Add carrier to list if not empty
      if (carrierName) {
        carriersMap.push({
          name: carrierName,
          rateGuarantee: rateGuaranteeText,
        });
      }
    }

    return carriersMap;
  }, [results, selectedPlanOption]);

  // Process coverages and build benefit data map
  const benefitData = useMemo(() => {
    const benefitDataMap: BenefitDataMap = {};

    // Initialize tracking arrays for subtotals and grand total
    const pooledTotal = new Array(carriers.length).fill(0);
    const experienceTotal = new Array(carriers.length).fill(0);
    const grandTotal = new Array(carriers.length).fill(0);

    // Process each result (document)
    for (const result of results) {
      // Filter coverages by selected plan option
      const allCoveragesArray = result.allCoverages || [];
      const filteredCoverages = selectedPlanOption
        ? allCoveragesArray.filter(
            (coverage: Coverage) =>
              coverage.planOptionName === selectedPlanOption
          )
        : allCoveragesArray;

      // Process each coverage
      for (const coverage of filteredCoverages) {
        // Skip coverages without necessary data
        if (!coverage.coverageType) {
          continue; // Skip this coverage
        }

        // Normalize the coverage type for consistent grouping
        const normalizedType =
          coverageTypeMap[coverage.coverageType] || coverage.coverageType;
          
        // Find carrier index by name comparison (case insensitive)
        const carrierIndex = carriers.findIndex(
          carrier => carrier.name?.toUpperCase() === coverage.carrierName?.toUpperCase()
        );
        
        // Skip if carrier not found
        if (carrierIndex === -1) {
          continue;
        }

        // Handle special coverage types with single/family breakdowns
        if (coverageDetailKeys[normalizedType]) {
          // For coverages like Extended Healthcare, Dental Care, and HSA that have single/family breakdowns
          const details = coverage.benefitDetails || {};
          
          // Process each variant (Single, Family, Admin Fee, etc.)
          for (const [variant, fields] of Object.entries(coverageDetailKeys[normalizedType])) {
            // Create benefit data key with variant
            const benefitKey = `${normalizedType} - ${variant}`;
            
            // Initialize benefit data item if it doesn't exist
            if (!benefitDataMap[benefitKey]) {
              benefitDataMap[benefitKey] = {
                values: new Array(carriers.length).fill(null).map(() => ({
                  volume: '-',
                  unitRate: '-',
                  monthlyPremium: '-',
                })),
              };
            }
            
            // Helper function to extract value with proper type checking
            const extractValue = (key: string | null): string | number | null => {
              if (!key) {
                return null;
              }
              
              const value = details[key];
              // Check if value is undefined, null, or an object (including empty objects)
              if (value === undefined || value === null || typeof value === 'object') {
                return null;
              }
              
              // Ensure we're returning either a string or number
              if (typeof value === 'string' || typeof value === 'number') {
                return value;
              }
              
              return null;
            };
            
            // Get values from coverage details with proper type checking
            const premium = extractValue(fields.premium);
            const rate = fields.rate ? extractValue(fields.rate) : null;
            const volume = fields.volume ? extractValue(fields.volume) : null;
            
            // Format values with additional type safety
            const formattedVolume = volume !== null && volume !== undefined ? formatVolume(volume) : '-';
            const formattedRate = rate !== null && rate !== undefined ? `${rate}` : '-';
            const formattedPremium = premium !== null && premium !== undefined ? formatCurrency(Number(premium)) : '-';
            
            // Update benefit data
            benefitDataMap[benefitKey].values[carrierIndex] = {
              volume: formattedVolume,
              unitRate: formattedRate,
              monthlyPremium: formattedPremium,
            };
            
            // Add to experience total
            if (premium && !Number.isNaN(Number(premium))) {
              experienceTotal[carrierIndex] += Number(premium);
              grandTotal[carrierIndex] += Number(premium);
            }
          }
        } else {
          // Standard coverage types
          // Initialize benefit data item if it doesn't exist
          if (!benefitDataMap[normalizedType]) {
            benefitDataMap[normalizedType] = {
              values: new Array(carriers.length).fill(null).map(() => ({
                volume: '-',
                unitRate: '-',
                monthlyPremium: '-',
              })),
            };
          }

          // Format coverage values
          const formattedVolume = formatVolume(coverage.volume);
          const formattedUnitRate = coverage.unitRate
            ? `${coverage.unitRate}${coverage.unitRateBasis ? `/${coverage.unitRateBasis}` : ''}`
            : '-';
          const formattedPremium = coverage.monthlyPremium 
            ? formatCurrency(coverage.monthlyPremium)
            : '-';
            
          // Update the benefit data with formatted values
          benefitDataMap[normalizedType].values[carrierIndex] = {
            volume: formattedVolume,
            unitRate: formattedUnitRate,
            monthlyPremium: formattedPremium,
          };

          // Add to subtotal and grand total
          const premium = coverage.monthlyPremium
            ? Number.parseFloat(String(coverage.monthlyPremium).replace(/,/g, ''))
            : 0;
            
          if (!Number.isNaN(premium)) {
            // Determine which subtotal category this goes to
            if (pooledCoverageTypes.includes(normalizedType)) {
              pooledTotal[carrierIndex] += premium;
            } else if (experienceCoverageTypes.includes(normalizedType)) {
              experienceTotal[carrierIndex] += premium;
            }

            // Add to grand total regardless
            grandTotal[carrierIndex] += premium;
          }
        }
      }
    }

    // Add subtotals and totals to benefit data map
    if (benefitDataMap && Object.keys(benefitDataMap).length > 0) {
      // Add pooled subtotal
      if (!benefitDataMap['Pooled Subtotal']) {
        benefitDataMap['Pooled Subtotal'] = {
          isSubtotal: true,
          values: [],
        };
      }
      benefitDataMap['Pooled Subtotal'].values = pooledTotal.map((total) => ({
        volume: '-',
        unitRate: '-',
        monthlyPremium: formatCurrency(total),
      }));

      // Add experience subtotal
      if (!benefitDataMap['Experience Subtotal']) {
        benefitDataMap['Experience Subtotal'] = {
          isSubtotal: true,
          values: [],
        };
      }
      benefitDataMap['Experience Subtotal'].values = experienceTotal.map(
        (total) => ({
          volume: '-',
          unitRate: '-',
          monthlyPremium: formatCurrency(total),
        })
      );

      // Add grand total
      if (!benefitDataMap['Grand Total']) {
        benefitDataMap['Grand Total'] = { isTotal: true, values: [] };
      }
      benefitDataMap['Grand Total'].values = grandTotal.map((total) => ({
        volume: '-',
        unitRate: '-',
        monthlyPremium: formatCurrency(total),
      }));

      // Add rate guarantee rows if available
      for (let idx = 0; idx < carriers.length; idx++) {
        const carrier = carriers[idx];
        if (carrier.rateGuarantee) {
          if (!benefitDataMap['Rate Guarantees']) {
            benefitDataMap['Rate Guarantees'] = {
              isRateGuarantee: true,
              values: new Array(carriers.length).fill(null).map(() => ({
                volume: '-',
                unitRate: '-',
                monthlyPremium: '-',
              })),
            };
          }

          benefitDataMap['Rate Guarantees'].values[idx] = {
            volume: '-',
            unitRate: '-',
            monthlyPremium: carrier.rateGuarantee,
          };
        }
      }
    }

    return benefitDataMap;
  }, [results, carriers, selectedPlanOption]);


  // Order benefits for display
  const orderedBenefits = useMemo(() => {
    if (!benefitData) {
      return [];
    }
    
    const orderedKeys: string[] = [];
    const specialCoverages: string[] = [];
    
    // First add all standard coverage types in a specific order
    for (const coverageType of pooledCoverageTypes) {
      if (benefitData[coverageType]) {
        orderedKeys.push(coverageType);
      }
    }
    
    // Add Pooled Subtotal after pooled coverages
    if (benefitData['Pooled Subtotal']) {
      orderedKeys.push('Pooled Subtotal');
    }
    
    // Next add experience-rated coverages
    for (const coverageType of experienceCoverageTypes) {
      // Handle standard coverage types
      if (benefitData[coverageType]) {
        orderedKeys.push(coverageType);
      }
      
      // Handle special variants like Extended Healthcare - Single, Dental Care - Family
      for (const key of Object.keys(benefitData)) {
        // Check if this is a variant of the current coverage type
        if (key.startsWith(`${coverageType} - `)) {
          specialCoverages.push(key);
        }
      }
    }
    
    // Add special coverage variants in a predictable order
    specialCoverages.sort();
    for (const key of specialCoverages) {
      orderedKeys.push(key);
    }
    
    // Add Experience Subtotal after experience coverages
    if (benefitData['Experience Subtotal']) {
      orderedKeys.push('Experience Subtotal');
    }
    
    // Add Grand Total
    if (benefitData['Grand Total']) {
      orderedKeys.push('Grand Total');
    }
    
    // Add Rate Guarantees at the very end
    if (benefitData['Rate Guarantees']) {
      orderedKeys.push('Rate Guarantees');
    }
    
    return orderedKeys;
  }, [benefitData]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Premium Comparison Table</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {planOptions.length > 0 && (
          <div className="flex justify-between mb-4">
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground mr-2">
                Plan Option:
              </span>
              <Select
                value={selectedPlanOption || ''}
                onValueChange={(value: string) => setSelectedPlanOption(value)}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Select a plan option" />
                </SelectTrigger>
                <SelectContent>
                  {planOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Benefit</TableHead>
              {carriers.map((carrier, index) => (
                <React.Fragment key={`carrier-${index}`}>
                  <TableHead className="text-center">
                    {carrier.name} - Volume
                  </TableHead>
                  <TableHead className="text-center">
                    {carrier.name} - Unit Rate
                  </TableHead>
                  <TableHead className="text-center">
                    {carrier.name} - Monthly Premium
                  </TableHead>
                </React.Fragment>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(orderedBenefits || []).map((benefitName, index) => {
              const benefit = benefitData[benefitName] || { values: [], isSubtotal: false, isTotal: false, isRateGuarantee: false };
              const isSubtotal = benefit.isSubtotal || false;
              const isTotal = benefit.isTotal || false;
              const isRateGuarantee = benefit.isRateGuarantee || false;

              // Apply special styling based on row type
              let rowClassName = '';
              if (isTotal) {
                rowClassName = 'font-bold bg-primary/5';
              } else if (isRateGuarantee) {
                rowClassName = 'font-medium bg-muted/20';
              } else if (isSubtotal) {
                rowClassName = 'font-medium bg-muted/50';
              } else {
                rowClassName = 'hover:bg-muted/30';
              }

              return (
                <TableRow key={`benefit-${index}`} className={rowClassName}>
                  <TableCell>{benefitName}</TableCell>
                  {carriers.map((_, carrierIndex) => (
                    <React.Fragment
                      key={`benefit-${index}-carrier-${carrierIndex}`}
                    >
                      <TableCell className="text-center">
                        {!isSubtotal && !isTotal && !isRateGuarantee
                          ? benefit.values[carrierIndex]?.volume
                          : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {!isSubtotal && !isTotal && !isRateGuarantee
                          ? benefit.values[carrierIndex]?.unitRate
                          : ''}
                      </TableCell>
                      <TableCell className="text-center">
                        {benefit.values[carrierIndex]?.monthlyPremium || '-'}
                      </TableCell>
                    </React.Fragment>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
