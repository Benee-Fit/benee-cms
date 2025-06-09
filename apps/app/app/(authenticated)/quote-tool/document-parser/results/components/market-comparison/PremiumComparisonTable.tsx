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
import { Badge } from '@repo/design-system/components/ui/badge';
import React, { useMemo, useState, useCallback } from 'react';

// Import ParsedDocumentResult and Coverage types
import type { ParsedDocumentResult, Coverage } from '../../../types';

/**
 * Define coverage types that are experience rated (vs pooled)
 * These coverage types are used to categorize benefits in the premium comparison table
 * and are referenced by isExperienceRatedCoverage function
 */
const experienceRatedCoverageTypes = [
  'Extended Healthcare',
  'Dental Care',
  'Vision',
  'EAP',
  'Health Spending Account',
  'HSA'
];

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

// Format unit rate as decimal (not currency) - CHANGED TO 2 DECIMAL PLACES
const formatUnitRate = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const numValue = typeof value === 'string' ? Number.parseFloat(value.replace(/,/g, '')) : value;

  if (Number.isNaN(numValue)) {
    return '-';
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2, // CHANGED FROM 3
    maximumFractionDigits: 2, // CHANGED FROM 3
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
  'Voluntary Accident': 'Voluntary Accident'
};


// Define the master benefit order for the table
const masterBenefitOrder = [
  'Basic Life',
  'AD&D',
  'Dependent Life',
  'Long Term Disability',
  'Medical Second Opinion',
  'Employee Assistance Program',
  'Subtotal-Pooled',
  'HEADER-EHC',
  'Extended Healthcare-Single',
  'Extended Healthcare-Family',
  'HEADER-DENTAL',
  'Dental Care-Single',
  'Dental Care-Family',
  'Subtotal-Experience',
  'Grand Total',
  'Rate Guarantees',
];

// Define order of coverage variants (Single, Family) for consistent display
const coverageVariantOrder: Record<string, string[]> = {
  'Extended Healthcare': ['Single', 'Family'],
  'Dental Care': ['Single', 'Family'],
  'Vision': ['Single', 'Family'],
  'EAP': ['Single', 'Family'],
  'Health Spending Account': ['Single', 'Family'],
  'HSA': ['Single', 'Family']
};


// Component type definitions
// Using the ParsedDocumentResult type for document metadata and coverages


interface PremiumComparisonTableProps {
  results: ParsedDocumentResult[];
}

// We're using the imported ParsedDocumentResult interface - commenting this out to avoid duplicate declaration
/* Interface already defined via import:
interface ParsedDocumentResult {
  metadata?: Metadata;
  allCoverages?: Coverage[];
  planOptions?: Array<{
    planOptionName: string;
    rateGuarantees?: string[];
 * Premium Comparison Table Component
 * Displays a comparison of insurance premiums across different carriers and benefit types
 */
export function PremiumComparisonTable({
  results,
}: PremiumComparisonTableProps): React.ReactElement {

  // State for per-carrier plan option selection
  const [selectedPlanOptions, setSelectedPlanOptions] = useState<Record<string, string>>({});

  // Extract plan options per carrier
  const carrierPlanOptions = useMemo(() => {
    const carrierOptions: Record<string, string[]> = {};

    for (const result of results) {
      if (result?.allCoverages) {
        for (const coverage of result.allCoverages) {
          if (coverage.planOptionName && coverage.carrierName) {
            if (!carrierOptions[coverage.carrierName]) {
              carrierOptions[coverage.carrierName] = [];
            }
            if (!carrierOptions[coverage.carrierName].includes(coverage.planOptionName)) {
              carrierOptions[coverage.carrierName].push(coverage.planOptionName);
            }
          }
        }
      }
    }
    
    return carrierOptions;
  }, [results]);

  /**
   * Extract rate guarantee text from metadata
   */
  const extractRateGuarantee = useCallback((rateGuarantees: string | string[] | null | undefined): string | null => {
    if (!rateGuarantees) {
      return null;
    }
    
    if (typeof rateGuarantees === 'string') {
      return rateGuarantees;
    }
    
    if (Array.isArray(rateGuarantees) && rateGuarantees.length > 0) {
      return rateGuarantees.join(', ');
    }
    
    return null;
  }, []);

  /**
   * Extract carriers from coverages when metadata is missing
   */
  const extractCarriersFromCoverages = useCallback((result: ParsedDocumentResult, carriersMap: Map<string, { name: string; rateGuarantee: string | null }>) => {
    if (!result.allCoverages || result.allCoverages.length === 0) {
      return;
    }
    
    const uniqueCarrierNames = new Set(
      result.allCoverages
        .map(coverage => coverage.carrierName)
        .filter(Boolean) as string[]
    );
    
    for (const carrierName of uniqueCarrierNames) {
      if (!carriersMap.has(carrierName)) {
        carriersMap.set(carrierName, {
          name: carrierName,
          rateGuarantee: null
        });
      }
    }
  }, []);

  /**
   * Process a single result to extract carrier information
   */
  const processResultForCarriers = useCallback((
    result: ParsedDocumentResult,
    carriersMap: Map<string, { name: string; rateGuarantee: string | null }>
  ) => {
    const metadata = result.metadata;
    
    if (!metadata?.carrierName) {
      extractCarriersFromCoverages(result, carriersMap);
      return;
    }
    
    const carrierName = metadata.carrierName;
    
    // Try multiple sources for rate guarantee information
    let rateGuaranteeText = extractRateGuarantee(metadata.rateGuarantees);
    
    // If no rate guarantee in metadata.rateGuarantees, check planOptions
    if (!rateGuaranteeText && result.planOptions) {
      for (const planOption of result.planOptions) {
        if (planOption.rateGuarantees && planOption.rateGuarantees.length > 0) {
          rateGuaranteeText = extractRateGuarantee(planOption.rateGuarantees);
          break;
        }
      }
    }
    
    if (!carriersMap.has(carrierName)) {
      carriersMap.set(carrierName, {
        name: carrierName,
        rateGuarantee: rateGuaranteeText
      });
    } else if (rateGuaranteeText && carriersMap.get(carrierName)?.rateGuarantee === null) {
      carriersMap.set(carrierName, {
        name: carrierName,
        rateGuarantee: rateGuaranteeText
      });
    }
  }, [extractRateGuarantee, extractCarriersFromCoverages]);

  /**
   * Extract unique carriers from results with preferred ordering
   */
  const carriers = useMemo<Array<{
    name: string;
    rateGuarantee: string | null;
  }>>(() => {
    if (!results || results.length === 0) {
      return [{ name: 'No Data Available', rateGuarantee: null }];
    }
    
    const carriersMap = new Map<string, { name: string; rateGuarantee: string | null }>();
    
    for (const result of results) {
      processResultForCarriers(result, carriersMap);
    }
    
    if (carriersMap.size === 0) {
      return [{ name: 'No Carrier Data', rateGuarantee: null }];
    }
    
    // Define preferred carrier order for consistent display
    const preferredOrder = [
      'Manulife',
      'Manulife Financial', 
      'Sun Life',
      'Sun Life Financial',
      'Empire Life',
      'Canada Life',
      'Victor',
      'Victor Insurance'
    ];
    
    const carriersArray = Array.from(carriersMap.values());
    
    // Sort carriers according to preferred order, with unknown carriers at the end
    return carriersArray.sort((a, b) => {
      const indexA = preferredOrder.findIndex(preferred => 
        a.name.toLowerCase().includes(preferred.toLowerCase()) || 
        preferred.toLowerCase().includes(a.name.toLowerCase())
      );
      const indexB = preferredOrder.findIndex(preferred => 
        b.name.toLowerCase().includes(preferred.toLowerCase()) || 
        preferred.toLowerCase().includes(b.name.toLowerCase())
      );
      
      // If both carriers are in preferred order, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // If only one is in preferred order, it comes first
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // If neither is in preferred order, sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [results, processResultForCarriers]);

  // Set default selected plan options when carriers change
  React.useEffect(() => {
    const newSelectedOptions: Record<string, string> = {};
    let hasChanges = false;
    
    carriers.forEach(carrier => {
      const availableOptions = carrierPlanOptions[carrier.name] || [];
      if (availableOptions.length > 0) {
        // If not already set, use the first available option
        if (!selectedPlanOptions[carrier.name]) {
          newSelectedOptions[carrier.name] = availableOptions[0];
          hasChanges = true;
        } else {
          newSelectedOptions[carrier.name] = selectedPlanOptions[carrier.name];
        }
      }
    });
    
    // Only update if there are actual changes
    if (hasChanges) {
      setSelectedPlanOptions(newSelectedOptions);
    }
  }, [carriers, carrierPlanOptions]);

  // Function to update plan option for a specific carrier
  const updateCarrierPlanOption = useCallback((carrierName: string, planOption: string) => {
    setSelectedPlanOptions(prev => ({
      ...prev,
      [carrierName]: planOption
    }));
  }, []);

  // Helper function to parse a value to a numeric value for calculations
  const parseNumericValue = useCallback((value: string | number | null | undefined): number => {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    
    if (typeof value === 'number') {
      return value;
    }
    
    // Handle string values, removing any formatting
    const cleanValue = value.toString().replace(/[^0-9.-]/g, '');
    const parsedValue = Number.parseFloat(cleanValue);
    
    return Number.isNaN(parsedValue) ? 0 : parsedValue;
  }, []);
  
  // Helper function to normalize coverage types to standard naming
  const getNormalizedCoverageType = useCallback((type: string): string => {
    return coverageTypeMap[type] || type;
  }, []);
  
  // Check if a coverage type is experience-rated
  const isExperienceRatedCoverage = useCallback((coverageType: string): boolean => {
    return experienceRatedCoverageTypes.includes(coverageType);
  }, []);
  
  // Helper function to extract and normalize values
  const extractValue = useCallback((value: string | number | null | undefined): string | number | null => {
    if (value === null || value === undefined) {
      return null;
    }
    
    if (typeof value === 'object') {
      return null;
    }
    
    return value;
  }, []);
  


  /**
   * Filter coverages by plan option for a specific carrier
   */
  const filterCoveragesByCarrierPlan = useCallback((
    coverages: Coverage[] | undefined, 
    carrierName: string
  ): Coverage[] => {
    if (!coverages) {
      return [];
    }
    
    const selectedPlan = selectedPlanOptions[carrierName];
    if (!selectedPlan) {
      return coverages;
    }
    
    return coverages.filter((coverage) => 
      !coverage.planOptionName || coverage.planOptionName === selectedPlan
    );
  }, [selectedPlanOptions]);


  /**
   * Process parsed insurance document results to create ordered rows
   */
  const orderedRows = useMemo(() => {
    if (carriers.length === 0) {
      return [];
    }

    const carriersLength = carriers.length;
    const pooledTotal = new Array(carriersLength).fill(0);
    const experienceTotal = new Array(carriersLength).fill(0);
    const grandTotal = new Array(carriersLength).fill(0);

    // 1. First, create a quick-access map of all coverages for performance.
    const processedCoverages = new Map<string, Coverage>();
    for (const result of results) {
      const carrierName = result.metadata?.carrierName || result.allCoverages?.[0]?.carrierName;
      if (!carrierName) continue;
      
      const carrierIdx = carriers.findIndex(c => c.name === carrierName);
      if (carrierIdx === -1) continue;

      const filteredCoverages = filterCoveragesByCarrierPlan(result.allCoverages, carrierName);

      for (const coverage of filteredCoverages) {
        const normalizedType = getNormalizedCoverageType(coverage.coverageType);
        const key = `${carrierName}-${normalizedType}`;
        processedCoverages.set(key, coverage);
      }
    }

    // 2. Now, build the orderedRows array by iterating through our master list.
    const rows: any[] = [];
    for (const key of masterBenefitOrder) {
      if (key.startsWith('HEADER-')) {
        // Handle Header Rows
        if (key === 'HEADER-EHC') {
          rows.push({ 
            key, 
            type: 'header', 
            label: 'HEALTH CARE (EHC)', 
            volume: '',
            values: new Array(carriersLength).fill({ unitRate: '', monthlyPremium: '' })
          });
        }
        if (key === 'HEADER-DENTAL') {
          rows.push({ 
            key, 
            type: 'header', 
            label: 'DENTAL CARE', 
            volume: '',
            values: new Array(carriersLength).fill({ unitRate: '', monthlyPremium: '' })
          });
        }
      } else if (key.startsWith('Subtotal-')) {
        // Handle Subtotal Rows - will be inserted later
        continue;
      } else if (key === 'Grand Total' || key === 'Rate Guarantees') {
        // Totals and Guarantees are handled at the end
        continue;
      } else if (key.includes('-Single') || key.includes('-Family')) {
        // Handle Single/Family sub-rows for EHC and Dental
        const [baseType, variant] = key.split('-');
        
        // Find first coverage with lives data for volume column
        const firstCoverageWithLives = carriers
          .map(c => processedCoverages.get(`${c.name}-${baseType}`))
          .find(cov => cov && (variant === 'Single' ? (cov as any).livesSingle : (cov as any).livesFamily));
        const lives = variant === 'Single' ? (firstCoverageWithLives as any)?.livesSingle : (firstCoverageWithLives as any)?.livesFamily;
        
        const rowData = {
          key,
          type: 'subBenefit',
          label: variant,
          volume: formatVolume(lives),
          values: new Array(carriersLength).fill({ unitRate: '', monthlyPremium: '$0.00' })
        };

        carriers.forEach((carrier, idx) => {
          const coverage = processedCoverages.get(`${carrier.name}-${baseType}`);
          if (coverage) {
            // Handle Single/Family variants - data is stored directly on coverage object
            let premium, rate;
            
            if (variant === 'Single') {
              // For Single: total premium for all single enrollees
              premium = (coverage as any).premiumPerSingle || 0;
              rate = (coverage as any).premiumPerSingle || coverage.unitRate;
            } else {
              // For Family: need to normalize premiumPerFamily data
              const familyLives = (coverage as any).livesFamily || 1;
              const familyPremium = (coverage as any).premiumPerFamily || 0;
              
              // Check if premiumPerFamily is already the per-unit rate or total premium
              // If familyLives > 1 and familyPremium seems like a total (much larger than single rate)
              const singleRate = (coverage as any).premiumPerSingle || 0;
              
              // Heuristic: if familyPremium is more than 3x the singleRate, it's likely a total
              // Otherwise, treat it as per-unit rate
              if (familyLives > 1 && singleRate > 0 && familyPremium > (singleRate * 3)) {
                // familyPremium appears to be total family premium, calculate per-unit rate
                rate = familyPremium / familyLives;
                premium = familyPremium;  // Use the total as-is
              } else {
                // familyPremium appears to be per-unit rate
                rate = familyPremium;
                premium = rate * familyLives;  // Calculate total: rate × volume
              }
            }
            
            rowData.values[idx] = {
              unitRate: formatUnitRate(rate),
              monthlyPremium: formatCurrency(premium),
            };
            
            const numericPremium = parseNumericValue(premium);
            if (numericPremium > 0) {
              experienceTotal[idx] += numericPremium;
              grandTotal[idx] += numericPremium;
            }
          }
        });
        rows.push(rowData);
      } else {
        // Handle standard benefit rows
        // Find first coverage with volume for the consolidated volume column
        const firstCoverageWithVolume = carriers
          .map(c => processedCoverages.get(`${c.name}-${key}`))
          .find(cov => cov?.volume);
          
        const rowData = {
          key,
          type: 'benefit',
          label: key,
          volume: firstCoverageWithVolume ? formatVolume(firstCoverageWithVolume.volume) : '-',
          values: new Array(carriersLength).fill({ unitRate: '-', monthlyPremium: '$0.00' })
        };

        carriers.forEach((carrier, idx) => {
          const coverage = processedCoverages.get(`${carrier.name}-${key}`);
          if (coverage) {
            rowData.values[idx] = {
              unitRate: formatUnitRate(coverage.unitRate),
              monthlyPremium: formatCurrency(coverage.monthlyPremium),
            };
            
            // THIS IS THE KEY CHANGE:
            // Only add to totals here if it's NOT a benefit that we are
            // handling with a single/family breakdown.
            const numericPremium = parseNumericValue(coverage.monthlyPremium);
            if (numericPremium > 0 && key !== 'Extended Healthcare' && key !== 'Dental Care') {
              // Determine if this is pooled or experience-rated
              const isPooled = !isExperienceRatedCoverage(key);
              if (isPooled) {
                pooledTotal[idx] += numericPremium;
              } else {
                experienceTotal[idx] += numericPremium;
              }
              grandTotal[idx] += numericPremium;
            }
          }
        });
        rows.push(rowData);
      }
    }

    // 3. Filter out empty benefit rows (where no carrier has a premium)
    const filteredRows = rows.filter(row => {
      // Keep headers, subtotals, and other summary rows
      if (row.type !== 'benefit') {
        return true;
      }
      // Check if any carrier has a non-zero premium for this benefit
      return row.values.some((cell: any) => cell && parseNumericValue(cell.monthlyPremium) > 0);
    });

    // 4. Insert subtotals, grand total, and rate guarantees at the correct positions.
    const finalRows: any[] = [];
    for (const row of filteredRows) {
      finalRows.push(row);
      
      // CHANGE 1: Insert Pooled Subtotal after Dependent Life
      if (row.label === 'Dependent Life') {
        finalRows.push({
          key: 'Subtotal-Pooled',
          type: 'subtotal',
          label: 'Sub-total - Pooled Coverage',
          volume: '',
          isBold: true,
          values: pooledTotal.map(total => ({ 
            unitRate: '', 
            monthlyPremium: formatCurrency(total) 
          }))
        });
      }
      
      if (row.label === 'Family' && row.type === 'subBenefit') {
        // Check if this is the last Family row (Dental Care)
        const currentIndex = finalRows.length - 1;
        const isDentalFamily = finalRows.slice(0, currentIndex).some(r => r.label === 'DENTAL CARE');
        if (isDentalFamily) {
          finalRows.push({
            key: 'Subtotal-Experience',
            type: 'subtotal',
            label: 'Sub-total - Experience Rated Benefits',
            volume: '',
            isBold: true,
            values: experienceTotal.map(total => ({ 
              unitRate: '', 
              monthlyPremium: formatCurrency(total) 
            }))
          });
        }
      }
    }

    finalRows.push({
      key: 'Grand Total',
      type: 'total',
      label: 'TOTAL MONTHLY PREMIUM*',
      volume: '',
      values: grandTotal.map(total => ({ 
        unitRate: '', 
        monthlyPremium: formatCurrency(total) 
      }))
    });
    
    finalRows.push({
      key: 'Rate Guarantees',
      type: 'rateGuarantee',
      label: 'Rate Guarantees',
      volume: '',
      isBold: true,
      values: carriers.map(carrier => ({ 
        unitRate: '', 
        monthlyPremium: carrier.rateGuarantee || '-' 
      }))
    });

    return finalRows;
  }, [carriers, results, selectedPlanOptions, filterCoveragesByCarrierPlan, getNormalizedCoverageType, isExperienceRatedCoverage, parseNumericValue]);
  

  return (
    <Card>
      <CardHeader>
        <CardTitle>Premium Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(carrierPlanOptions).length > 0 && (
          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-2">
              Plan Options by Carrier:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {carriers.map((carrier) => {
                const availableOptions = carrierPlanOptions[carrier.name] || [];
                if (availableOptions.length === 0) return null;
                
                return (
                  <div key={carrier.name} className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {carrier.name}
                    </label>
                    <Select
                      value={selectedPlanOptions[carrier.name] || ''}
                      onValueChange={(value: string) => updateCarrierPlanOption(carrier.name, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select plan option" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {availableOptions.length > 1 && (
                      <span className="text-xs text-muted-foreground">
                        {availableOptions.length} options available
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="overflow-x-auto border rounded-lg shadow-sm">
          <Table className="table-auto text-sm w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[445px] sticky left-0 bg-background border-r z-20 border-b-2 border-b-teal-500 px-3 py-3" colSpan={2}>
                  <div className="font-semibold text-base text-teal-600">Carrier</div>
                </TableHead>
                {carriers.map((carrier, index) => {
                  const selectedPlan = selectedPlanOptions[carrier.name];
                  const availableOptions = carrierPlanOptions[carrier.name] || [];
                  
                  return (
                    <TableHead
                      key={`header-carrier-${index}`}
                      className={`text-center px-3 py-3 border-l border-b-2 border-b-teal-500 transition-colors duration-200 hover:bg-teal-50/50 cursor-default ${index % 2 === 1 ? 'bg-slate-100/50' : ''}`}
                      colSpan={2}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold text-base text-teal-600">{carrier.name || 'Unknown Carrier'}</span>
                        {selectedPlan && (
                          <Badge variant="outline">
                            {selectedPlan}
                            {availableOptions.length > 1 && (
                              <span className="ml-1">
                                (1/{availableOptions.length})
                              </span>
                            )}
                          </Badge>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
              <TableRow>
                <TableHead className="w-[375px] sticky left-0 bg-background border-r z-20 border-b-2 border-b-teal-500 px-3 py-3">
                  <div className="font-semibold text-sm">Benefit</div>
                </TableHead>
                <TableHead className="border-b-2 border-b-teal-500 text-center px-3 py-3">
                  <div className="font-semibold text-sm">Volume</div>
                </TableHead>
                {carriers.map((_, index) => (
                  <React.Fragment key={`subheader-${index}`}>
                    <TableHead className={`text-center border-l border-b-2 border-b-teal-500 px-3 py-3 w-[100px] min-w-[100px] max-w-[100px] ${index % 2 === 1 ? 'bg-slate-100/50' : ''}`}>Unit Rate</TableHead>
                    <TableHead className={`text-center border-b-2 border-b-teal-500 px-3 py-3 w-[150px] min-w-[150px] max-w-[150px] ${index % 2 === 1 ? 'bg-slate-100/50' : ''}`}>Monthly Premium</TableHead>
                  </React.Fragment>
                ))}
              </TableRow>
            </TableHeader>
          <TableBody>
            {orderedRows.map((row, index) => {
              // Apply special styling based on row type
              let rowClassName = '';
              
              if (row.type === 'header') {
                // CHANGE 2: No background color for headers
                rowClassName = '';
              } else if (row.type === 'total') {
                rowClassName = 'font-bold bg-muted border-t-2 border-t-slate-300';
              } else if (row.type === 'rateGuarantee') {
                rowClassName = `${row.isBold ? 'font-bold' : 'font-medium'} bg-muted/20`;
              } else if (row.type === 'subtotal') {
                rowClassName = `${row.isBold ? 'font-bold' : 'font-medium'} bg-teal-50 border-t border-t-teal-200/50`;
              } else if (row.type === 'subBenefit') {
                rowClassName = 'hover:bg-muted/20 transition-colors duration-150';
              } else {
                rowClassName = 'hover:bg-muted/20 transition-colors duration-150';
              }
              
              // Enhanced styling for header rows
              if (row.type === 'header') {
                return (
                  <TableRow key={`row-${index}-${row.label}`}>
                    <TableCell className="font-bold text-sm border-y bg-muted/30 py-3 sticky left-0 z-10" colSpan={2 + carriers.length * 2}>
                      <div className="text-sm break-words leading-relaxed">{row.label}</div>
                    </TableCell>
                  </TableRow>
                );
              }
              
              if (row.type === 'rateGuarantee') {
                // Special rendering for Rate Guarantees row with proper spanning
                return (
                  <TableRow key={`row-${index}-${row.label}`} className={rowClassName}>
                    <TableCell className={`w-[445px] sticky left-0 bg-background border-r z-10 px-3 py-3 align-top ${row.isBold ? 'font-bold' : 'font-medium'}`} colSpan={2}>
                      <div className="text-sm break-words leading-relaxed">{row.label}</div>
                    </TableCell>
                    {carriers.map((_, carrierIndex) => (
                      <TableCell
                        key={`rate-guarantee-${carrierIndex}`}
                        colSpan={2}
                        className={`text-center px-3 py-3 border-l align-top ${carrierIndex % 2 === 1 ? 'bg-slate-100/50' : ''}`}
                      >
                        <div className={`break-words leading-relaxed ${row.isBold ? 'text-sm font-bold' : 'text-sm'}`}>
                          <span className="text-slate-600">
                            {row.values && row.values[carrierIndex]?.monthlyPremium || '-'}
                          </span>
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                );
              }
              
              return (
                <TableRow key={`row-${index}-${row.label}`} className={rowClassName}>
                  {row.label === 'Sub-total - Pooled Coverage' || row.label === 'Sub-total - Experience Rated Benefits' || row.label === 'TOTAL MONTHLY PREMIUM*' ? (
                    <TableCell className={`w-[445px] sticky left-0 border-r z-10 px-3 py-3 align-top ${row.type === 'subtotal' ? 'bg-teal-50' : row.type === 'total' ? 'bg-muted' : 'bg-background'} ${row.type === 'subBenefit' ? 'pl-6' : row.type === 'total' ? 'font-bold' : row.isBold ? 'font-bold' : row.type === 'subtotal' ? 'font-medium' : 'font-medium'}`} colSpan={2}>
                      <div className="text-sm break-words leading-relaxed">
                        {row.label}
                      </div>
                    </TableCell>
                  ) : (
                    <>
                      <TableCell className={`w-[375px] sticky left-0 border-r z-10 px-3 py-3 align-top ${row.type === 'subtotal' ? 'bg-teal-50' : row.type === 'total' ? 'bg-muted' : 'bg-background'} ${row.type === 'subBenefit' ? 'pl-6' : row.type === 'total' ? 'font-bold' : row.isBold ? 'font-bold' : row.type === 'subtotal' ? 'font-medium' : 'font-medium'}`}>
                        <div className="text-sm break-words leading-relaxed">
                          {row.label}
                        </div>
                      </TableCell>
                      <TableCell className={`text-center px-3 py-3 align-top ${row.type === 'subtotal' ? 'bg-teal-50' : row.type === 'total' ? 'bg-muted' : 'bg-slate-100/50'}`}>
                        <div className="text-sm break-words leading-relaxed">
                          {row.type !== 'subtotal' && 
                           row.type !== 'total' && 
                           row.type !== 'rateGuarantee' && 
                           row.type !== 'header'
                            ? row.volume || '-'
                            : "-"}
                        </div>
                      </TableCell>
                    </>
                  )}
                  {row.values && Array.isArray(row.values) ? row.values.map((cell: any, cellIdx: number) => (
                    <React.Fragment key={`${row.key}-${cellIdx}`}>
                      <TableCell className={`text-center px-3 py-3 align-top border-l ${row.type === 'subtotal' ? 'bg-teal-50' : row.type === 'total' ? 'bg-muted' : cellIdx % 2 === 1 ? 'bg-slate-100/50' : ''}`}>
                        <div className="text-sm break-words leading-relaxed">
                          {row.type !== 'subtotal' && 
                           row.type !== 'total' && 
                           row.type !== 'rateGuarantee' && 
                           row.type !== 'header'
                            ? cell?.unitRate || '-'
                            : "-"}
                        </div>
                      </TableCell>
                      <TableCell className={`text-center px-3 py-3 align-top ${row.type === 'subtotal' ? 'bg-teal-50' : row.type === 'total' ? 'bg-muted' : cellIdx % 2 === 1 ? 'bg-slate-100/50' : ''}`}>
                        <div className={`break-words leading-relaxed ${row.type === 'total' ? 'text-lg font-bold' : row.isBold ? 'text-sm font-bold' : 'text-sm font-medium'}`}>
                          {row.type !== 'header' ? (
                            <span className={`${cell?.monthlyPremium && cell.monthlyPremium !== '-' && parseNumericValue(cell.monthlyPremium) > 1000 ? 'text-slate-700' : ''}`}>
                              {cell?.monthlyPremium || '-'}
                            </span>
                          ) : "-"}
                        </div>
                      </TableCell>
                    </React.Fragment>
                  )) : (
                    // Fallback for rows without values array
                    carriers.map((_, cellIdx) => (
                      <React.Fragment key={`${row.key}-empty-${cellIdx}`}>
                        <TableCell className={`text-center px-3 py-3 align-top border-l ${row.type === 'total' ? 'bg-muted' : cellIdx % 2 === 1 ? 'bg-slate-100/50' : ''}`}>
                          <div className="text-sm">-</div>
                        </TableCell>
                        <TableCell className={`text-center px-3 py-3 align-top ${row.type === 'total' ? 'bg-muted' : cellIdx % 2 === 1 ? 'bg-slate-100/50' : ''}`}>
                          <div className={`${row.type === 'total' ? 'text-lg font-bold' : 'text-sm'}`}>-</div>
                        </TableCell>
                      </React.Fragment>
                    ))
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}