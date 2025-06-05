import React, { useMemo } from 'react';
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
} from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';

// Debug logging utility
const DEBUG_MODE = false;
const logDebug = (message: string, data?: any) => {
  if (DEBUG_MODE) {
    console.log(`PremiumComparisonTable: ${message}`, data);
  }
};

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
  coverages: Array<{
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
  }>;
  planNotes: Array<{ note: string }>;
}

interface PremiumComparisonTableProps {
  results: ParsedDocument[];
}

const PremiumComparisonTable: React.FC<PremiumComparisonTableProps> = ({ results = [] }) => {
  // Extract carrier names from results
  const carriers = useMemo(() => {
    const carrierNames = ['CARRIER'];
    
    if (results && results.length > 0) {
      results.forEach(result => {
        let carrierName = null;
        
        // Try to get carrier name from various locations
        if (result.metadata?.carrierName) {
          carrierName = result.metadata.carrierName.toUpperCase();
        } else if (result.coverages?.[0]?.carrierName) {
          carrierName = result.coverages[0].carrierName.toUpperCase();
        } else {
          carrierName = `CARRIER ${results.indexOf(result) + 1}`;
        }
        
        // Add to list if unique
        if (!carrierNames.includes(carrierName)) {
          carrierNames.push(carrierName);
        }
      });
    }
    
    logDebug('Extracted carrier names:', carrierNames);
    return carrierNames;
  }, [results]);

  // Process results to build benefit data
  const benefitData = useMemo(() => {
    const benefitDataMap: Record<string, any> = {};
    const carrierCount = carriers.length - 1;
    
    // Define insurance categories
    const insuranceCategories = {
      'pooled': [
        'Basic Life', 'AD&D', 'Dependent Life', 'Critical Illness', 'LTD', 'STD'
      ],
      'experience': [
        'Extended Healthcare', 'Dental Care', 'Vision', 'EAP', 'Health Spending Account', 'HSA'
      ]
    };
    
    // Initialize an empty values array for each carrier
    const createEmptyValuesArray = () => {
      return Array(carrierCount).fill(null).map(() => ({ volume: '', unitRate: '', monthlyPremium: '' }));
    };
    
    // Map to normalize coverage type names
    const coverageTypeMap: Record<string, string> = {
      'Basic Life': 'Basic Life',
      'AD&D': 'AD&D',
      'Dependent Life': 'Dependent Life',
      'Critical Illness': 'Critical Illness',
      'LTD': 'Long Term Disability',
      'STD': 'Short Term Disability',
      'Extended Healthcare': 'Health Care (EHC)',
      'Health Care (EHC)': 'Health Care (EHC)', // Add mapping for possible alternate name
      'Vision': 'Vision',
      'Dental Care': 'Dental Care',
      'EAP': 'EAP',
      'Health Spending Account': 'HSA',
      'HSA': 'HSA'
    };
    
    // Helper function to format number as currency
    const formatNumber = (num: number | undefined) => {
      if (num === undefined || num === null) return '';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
    };
    
    // Helper function to format volume with dollar sign
    const formatVolume = (vol: number | undefined) => {
      if (vol === undefined || vol === null) return '';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
      }).format(vol);
    };
    
    // Process each result and extract coverage data
    if (results && results.length > 0) {
      results.forEach((result, resultIndex) => {
        // Get carrier name
        let carrierName = null;
        
        if (result.metadata?.carrierName) {
          carrierName = result.metadata.carrierName.toUpperCase();
        } else if (result.coverages?.[0]?.carrierName) {
          carrierName = result.coverages[0].carrierName.toUpperCase();
        } else {
          carrierName = `CARRIER ${resultIndex + 1}`;
        }
        
        const carrierIndex = carriers.indexOf(carrierName) - 1;
        logDebug(`Processing result ${resultIndex}, carrier: ${carrierName}, index: ${carrierIndex}`);
        
        if (carrierIndex < 0) {
          logDebug(`Warning: Carrier ${carrierName} not found in carriers list`, carriers);
          return; // Skip if carrier not found
        }
        
        // Process coverages
        const coveragesArray = result.coverages || [];
        
        if (coveragesArray.length > 0) {
          coveragesArray.forEach(coverage => {
            if (!coverage.coverageType) return;
            
            // Ensure coverageType is a string, not an object
            const coverageTypeStr = typeof coverage.coverageType === 'string' 
              ? coverage.coverageType 
              : (coverage.coverageType ? String(coverage.coverageType) : 'Unknown');
            
            // Normalize coverage type
            const normalizedType = coverageTypeMap[coverageTypeStr] || coverageTypeStr;
            logDebug(`Processing coverage: ${coverageTypeStr} -> normalized to: ${normalizedType}`, coverage);
            
            // Initialize data structure if needed
            if (!benefitDataMap[normalizedType]) {
              benefitDataMap[normalizedType] = {
                values: createEmptyValuesArray()
              };
            }
            
            // Extract data fields
            const volume = coverage.volume;
            const unitRate = coverage.unitRate;
            const monthlyPremium = coverage.monthlyPremium || coverage.premium;
            
            // Update the values array for this benefit type
            benefitDataMap[normalizedType].values[carrierIndex] = {
              volume: volume !== undefined ? formatVolume(volume) : '',
              unitRate: unitRate !== undefined ? String(unitRate) : '',
              monthlyPremium: monthlyPremium ? formatNumber(monthlyPremium) : ''
            };
            
            // Handle rate guarantees
            if (result.metadata?.rateGuarantees) {
              if (!benefitDataMap['Rate Guarantee']) {
                benefitDataMap['Rate Guarantee'] = {
                  values: createEmptyValuesArray()
                };
              }
              
              // For Rate Guarantee, keep as string but make sure we're consistent with our data structure
              benefitDataMap['Rate Guarantee'].values[carrierIndex] = {
                volume: '',
                unitRate: '',
                // Store rate guarantee as string (don't apply currency formatting since it's not a currency)
                monthlyPremium: result.metadata.rateGuarantees || ''
              };
            }
          });
        }
      });
    }

    // Calculate subtotals and totals
    let pooledTotal = Array(carrierCount).fill(0);
    let experienceTotal = Array(carrierCount).fill(0);
    let grandTotal = Array(carrierCount).fill(0);

    // For each benefit, add up the premiums for subtotals and grand total
    Object.entries(benefitDataMap).forEach(([benefitName, benefit]) => {
      if (!benefit || !benefit.values) return; // Skip if benefit data is invalid
      
      benefit.values.forEach((value: any, carrierIndex: number) => {
        if (!value || !value.monthlyPremium) return;
        
        // Convert monthlyPremium from formatted string back to number
        // Ensure monthlyPremium is a string before using replace
        const monthlyPremiumStr = String(value.monthlyPremium);
        const premium = parseFloat(
          monthlyPremiumStr.replace(/[^0-9.-]+/g, '')
        ) || 0;
        
        // Check which category this benefit belongs to
        // Ensure benefitName is a string before calling includes
        const benefitNameStr = typeof benefitName === 'string' ? benefitName : String(benefitName);
        
        const isPooled = insuranceCategories.pooled.some(
          b => benefitNameStr.includes(b)
        );
        const isExperience = insuranceCategories.experience.some(
          b => benefitNameStr.includes(b)
        );
        
        // Add to appropriate totals
        if (isPooled) {
          pooledTotal[carrierIndex] += premium;
        } else if (isExperience) {
          experienceTotal[carrierIndex] += premium;
        }
        
        // Add to grand total
        grandTotal[carrierIndex] += premium;
      });
    });

    // Add subtotals and totals to the benefit data map
    benefitDataMap['Pooled Subtotal'] = {
      isSubtotal: true,
      values: pooledTotal.map(total => ({
        volume: '',
        unitRate: '',
        monthlyPremium: formatNumber(total)
      }))
    };

    benefitDataMap['Experience Subtotal'] = {
      isSubtotal: true,
      values: experienceTotal.map(total => ({
        volume: '',
        unitRate: '',
        monthlyPremium: formatNumber(total)
      }))
    };

    benefitDataMap['Grand Total'] = {
      isTotal: true,
      values: grandTotal.map(total => ({
        volume: '',
        unitRate: '',
        monthlyPremium: formatNumber(total)
      }))
    };

    return benefitDataMap;
  }, [results, carriers]);

  // Define benefit order for display
  const benefitOrder = [
    'Basic Life',
    'AD&D',
    'Dependent Life',
    'Critical Illness',
    'Long Term Disability',
    'Short Term Disability',
    'Pooled Subtotal',
    'Health Care (EHC)',
    'Dental Care',
    'Vision',
    'EAP',
    'HSA',
    'Experience Subtotal',
    'Rate Guarantee',
    'Grand Total'
  ];

  // Sort benefit data according to defined order
  const sortedBenefitData = Object.entries(benefitData)
    .sort(([nameA], [nameB]) => {
      const indexA = benefitOrder.indexOf(nameA);
      const indexB = benefitOrder.indexOf(nameB);
      
      // If both are in the order list, sort by their position
      if (indexA >= 0 && indexB >= 0) {
        return indexA - indexB;
      }
      
      // If only one is in the list, prioritize it
      if (indexA >= 0) return -1;
      if (indexB >= 0) return 1;
      
      // If neither is in the list, sort alphabetically
      return nameA.localeCompare(nameB);
    });

  // Return empty state if no benefit data
  if (sortedBenefitData.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No premium data available for comparison.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0 overflow-auto">
        <Table className="border-collapse w-full">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-1/5">Coverage</TableHead>
              {carriers.slice(1).map((carrier, index) => (
                <React.Fragment key={`carrier-${index}`}>
                  <TableHead className="text-center">
                    {carrier}
                  </TableHead>
                </React.Fragment>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedBenefitData.map(([benefitName, benefit], index) => {
              const isSubtotal = benefit.isSubtotal;
              const isTotal = benefit.isTotal;
              
              // Apply special styling based on row type
              const rowClassName = isTotal
                ? 'font-bold bg-primary/5'
                : isSubtotal
                ? 'font-medium bg-muted/50'
                : 'hover:bg-muted/30';
              
              return (
                <TableRow key={`benefit-${index}`} className={rowClassName}>
                  <TableCell className="font-medium">
                    {benefit.indent && <span className="ml-4"></span>}
                    {benefitName}
                  </TableCell>
                  
                  {benefit.values.map((value: any, valueIndex: number) => {
                    // Ensure all values are strings or primitives suitable for rendering
                    const monthlyPremium = typeof value.monthlyPremium === 'object' 
                      ? JSON.stringify(value.monthlyPremium) 
                      : value.monthlyPremium || '';
                      
                    const unitRate = typeof value.unitRate === 'object'
                      ? JSON.stringify(value.unitRate)
                      : value.unitRate || '';
                      
                    const volume = typeof value.volume === 'object'
                      ? JSON.stringify(value.volume)
                      : value.volume || '';
                      
                    return (
                      <React.Fragment key={`value-${valueIndex}`}>
                        <TableCell className="text-center">
                          <div className="text-xs font-mono">
                            {monthlyPremium}
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{unitRate ? `Rate: ${unitRate}` : ''}</span>
                            <span>{volume}</span>
                          </div>
                        </TableCell>
                      </React.Fragment>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PremiumComparisonTable;
