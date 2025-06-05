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

// Debug output to console during development
// Only log in development environment
const debug = (...args: unknown[]): void => {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[PremiumComparisonTable]', ...args);
  }
};

// Format number as currency
const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return '$0.00';
  }

  const numValue = typeof value === 'string' ? Number.parseFloat(value) : value;

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
const formatVolume = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const numValue = typeof value === 'string' ? Number.parseFloat(value) : value;

  if (Number.isNaN(numValue)) {
    return '-';
  }

  // Format large numbers with commas
  return new Intl.NumberFormat('en-US').format(numValue);
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

// Interfaces for component props and data structure
interface CarrierProposal {
  carrierName: string;
  rateGuaranteeText?: string;
}

// Define interfaces for the component
interface PlanOption {
  planOptionName: string;
  carrierProposals: CarrierProposal[];
  rateGuarantees?: string[];
}

interface Metadata {
  carrierName?: string;
  primaryCarrierName?: string | null;
  rateGuarantees?: string | string[] | null;
}

interface BenefitDataValue {
  volume: string;
  unitRate: string;
  monthlyPremium: string;
}

interface BenefitDataItem {
  isSubtotal?: boolean;
  isTotal?: boolean;
  isRateGuarantee?: boolean;
  values: BenefitDataValue[];
}

interface BenefitDataMap {
  [key: string]: BenefitDataItem;
}

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

        if (planOption?.rateGuarantees?.length > 0) {
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
        if (!coverage.coverageType || !coverage.monthlyPremium) {
          continue; // Skip this coverage
        }

        // Normalize the coverage type for consistent grouping
        const normalizedType =
          coverageTypeMap[coverage.coverageType] || coverage.coverageType;

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
        const formattedPremium = formatCurrency(
          coverage.monthlyPremium
            ? Number.parseFloat(
                coverage.monthlyPremium.toString().replace(/,/g, '')
              )
            : 0
        );

        // Find carrier index by name comparison (case insensitive)
        const carrierIndex = carriers.findIndex(
          carrier => carrier.name?.toUpperCase() === coverage.carrierName?.toUpperCase()
        );
        
        // Update the benefit data with formatted values if carrier found
        if (carrierIndex !== -1) {
          benefitDataMap[normalizedType].values[carrierIndex] = {
            volume: formattedVolume,
            unitRate: formattedUnitRate,
            monthlyPremium: formattedPremium,
          };

          // Add to subtotal and grand total
          const premium = Number.parseFloat(String(coverage.monthlyPremium || 0));
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
    const orderedKeys: string[] = [];

    // Add standard coverage types in a specific order
    for (const coverageType of [
      ...pooledCoverageTypes,
      ...experienceCoverageTypes,
    ]) {
      if (benefitData[coverageType]) {
        orderedKeys.push(coverageType);
      }
    }

    // Add any remaining coverage types that aren't in the standard lists
    for (const key of Object.keys(benefitData)) {
      if (
        !pooledCoverageTypes.includes(key) &&
        !experienceCoverageTypes.includes(key) &&
        key !== 'Pooled Subtotal' &&
        key !== 'Experience Subtotal' &&
        key !== 'Grand Total' &&
        key !== 'Rate Guarantees'
      ) {
        orderedKeys.push(key);
      }
    }

    // Add subtotals and totals at the end in a specific order
    if (benefitData['Pooled Subtotal']) {
      orderedKeys.push('Pooled Subtotal');
    }

    if (benefitData['Experience Subtotal']) {
      orderedKeys.push('Experience Subtotal');
    }

    if (benefitData['Grand Total']) {
      orderedKeys.push('Grand Total');
    }

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
