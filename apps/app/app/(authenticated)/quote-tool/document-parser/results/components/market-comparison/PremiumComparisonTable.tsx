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


// Define order of coverage variants (Single, Family) for consistent display
// Define variant order by coverage type
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

/**
 * Represents a single value cell in the benefit data table
 */
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
};

interface BenefitDataMap {
  [benefitKey: string]: BenefitDataItem;
}

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
    const rateGuaranteeText = extractRateGuarantee(metadata.rateGuarantees);
    
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
   * Extract unique carriers from results
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
    
    return carriersMap.size === 0 
      ? [{ name: 'No Carrier Data', rateGuarantee: null }]
      : Array.from(carriersMap.values());
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
   * Initialize benefit data for a new benefit key
   */
  const initializeBenefitData = useCallback((carriersLength: number): BenefitDataItem => ({
    values: new Array(carriersLength).fill(null).map(() => ({
      volume: "",
      unitRate: "",
      monthlyPremium: "",
    })),
  }), []);

  /**
   * Format benefit data values
   */
  const formatBenefitValues = useCallback((
    extractedVolume: string | number | null,
    extractedUnitRate: string | number | null,
    extractedPremium: string | number | null
  ): BenefitDataValue => ({
    volume: typeof extractedVolume === "number" ? formatVolume(extractedVolume) : extractedVolume || "",
    unitRate: typeof extractedUnitRate === "number" ? formatCurrency(extractedUnitRate) : extractedUnitRate || "",
    monthlyPremium: typeof extractedPremium === "number" ? formatCurrency(extractedPremium) : extractedPremium || "",
  }), []);

  /**
   * Get benefit key for a coverage item
   */
  const getBenefitKey = useCallback((coverageItem: Coverage, normalizedType: string): string => {
    const hasVariants = Object.prototype.hasOwnProperty.call(
      coverageVariantOrder,
      normalizedType
    );
    
    if (hasVariants && coverageItem.benefitDetails?.coverage_type) {
      return `${normalizedType} - ${coverageItem.benefitDetails.coverage_type}`;
    }
    
    return normalizedType;
  }, []);

  /**
   * Process a single coverage item and update benefit data
   */
  const processCoverageItem = useCallback((
    coverageItem: Coverage,
    carrierIdx: number,
    benefitData: BenefitDataMap,
    pooledTotal: number[],
    experienceTotal: number[],
    grandTotal: number[],
    carriers: Array<{ name: string; rateGuarantee: string | null }>
  ): { isPooled: boolean; benefitKey: string } => {
    const normalizedType = getNormalizedCoverageType(coverageItem.coverageType);
    const isPooled = !isExperienceRatedCoverage(normalizedType);
    const benefitKey = getBenefitKey(coverageItem, normalizedType);
    
    // Initialize benefit data if needed
    if (!benefitData[benefitKey]) {
      benefitData[benefitKey] = initializeBenefitData(carriers.length);
    }
    
    // Extract values
    const extractedVolume = extractValue(coverageItem.volume);
    const extractedUnitRate = extractValue(coverageItem.unitRate);
    const extractedPremium = extractValue(coverageItem.monthlyPremium);
    const numericPremium = parseNumericValue(extractedPremium);
    
    // Update benefit data
    benefitData[benefitKey].values[carrierIdx] = formatBenefitValues(
      extractedVolume,
      extractedUnitRate,
      extractedPremium
    );
    
    // Update totals
    if (numericPremium > 0) {
      if (isPooled) {
        pooledTotal[carrierIdx] += numericPremium;
      } else {
        experienceTotal[carrierIdx] += numericPremium;
      }
      grandTotal[carrierIdx] += numericPremium;
    }
    
    return { isPooled, benefitKey };
  }, [getNormalizedCoverageType, isExperienceRatedCoverage, extractValue, parseNumericValue, initializeBenefitData, getBenefitKey, formatBenefitValues]);

  /**
   * Add subtotal and total rows to benefit data
   */
  const addTotalRows = useCallback((
    benefitData: BenefitDataMap,
    pooledTotal: number[],
    experienceTotal: number[],
    grandTotal: number[],
    pooledSubtotalAdded: boolean,
    experienceSubtotalAdded: boolean
  ) => {
    if (pooledSubtotalAdded) {
      benefitData["Pooled Benefits Subtotal"] = {
        isSubtotal: true,
        values: pooledTotal.map((total) => ({
          volume: "",
          unitRate: "",
          monthlyPremium: formatCurrency(total),
        })),
      };
    }
    
    if (experienceSubtotalAdded) {
      benefitData["Experience Rated Benefits Subtotal"] = {
        isSubtotal: true,
        values: experienceTotal.map((total) => ({
          volume: "",
          unitRate: "",
          monthlyPremium: formatCurrency(total),
        })),
      };
    }
    
    benefitData["Grand Total"] = {
      isTotal: true,
      values: grandTotal.map((total) => ({
        volume: "",
        unitRate: "",
        monthlyPremium: formatCurrency(total),
      })),
    };
  }, []);

  /**
   * Add rate guarantee rows to benefit data
   */
  const addRateGuarantees = useCallback((
    benefitData: BenefitDataMap,
    carriers: Array<{ name: string; rateGuarantee: string | null }>
  ) => {
    for (let idx = 0; idx < carriers.length; idx++) {
      const carrier = carriers[idx];
      if (!carrier.rateGuarantee) {
        continue;
      }
      
      if (!benefitData["Rate Guarantees"]) {
        benefitData["Rate Guarantees"] = {
          isRateGuarantee: true,
          values: new Array(carriers.length).fill(null).map(() => ({
            volume: "",
            unitRate: "",
            monthlyPremium: "",
          })),
        };
      }
      
      if (benefitData["Rate Guarantees"]?.values?.[idx]) {
        benefitData["Rate Guarantees"].values[idx].monthlyPremium = carrier.rateGuarantee;
      }
    }
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
   * Process all results and build benefit data
   */
  const processResults = useCallback((
    benefitData: BenefitDataMap,
    pooledTotal: number[],
    experienceTotal: number[],
    grandTotal: number[]
  ): { pooledSubtotalAdded: boolean; experienceSubtotalAdded: boolean } => {
    let pooledSubtotalAdded = false;
    let experienceSubtotalAdded = false;
    
    for (const result of results) {
      // Try to get carrier name from metadata or coverages
      let carrierName = result.metadata?.carrierName;
      
      // If no carrier name in metadata, try to extract from first coverage
      if (!carrierName && result.allCoverages && result.allCoverages.length > 0) {
        const coverageWithCarrier = result.allCoverages.find(coverage => coverage.carrierName);
        carrierName = coverageWithCarrier?.carrierName;
      }
      
      if (!carrierName) {
        continue;
      }
      
      const carrierIdx = carriers.findIndex((c) => c.name === carrierName);
      if (carrierIdx === -1) {
        continue;
      }
      
      const coverages = filterCoveragesByCarrierPlan(result.allCoverages, carrierName);
      for (const coverageItem of coverages) {
        const { isPooled } = processCoverageItem(
          coverageItem,
          carrierIdx,
          benefitData,
          pooledTotal,
          experienceTotal,
          grandTotal,
          carriers
        );
        
        pooledSubtotalAdded = pooledSubtotalAdded || isPooled;
        experienceSubtotalAdded = experienceSubtotalAdded || !isPooled;
      }
    }
    
    return { pooledSubtotalAdded, experienceSubtotalAdded };
  }, [results, carriers, filterCoveragesByCarrierPlan, processCoverageItem]);

  /**
   * Process parsed insurance document results to create a structured benefit data map
   */
  const benefitDataMap = useMemo<BenefitDataMap>(() => {
    if (carriers.length === 0) {
      return {};
    }
    
    const benefitData: BenefitDataMap = {};
    const pooledTotal = new Array(carriers.length).fill(0);
    const experienceTotal = new Array(carriers.length).fill(0);
    const grandTotal = new Array(carriers.length).fill(0);
    
    const { pooledSubtotalAdded, experienceSubtotalAdded } = processResults(
      benefitData,
      pooledTotal,
      experienceTotal,
      grandTotal
    );
    
    addTotalRows(
      benefitData,
      pooledTotal,
      experienceTotal,
      grandTotal,
      pooledSubtotalAdded,
      experienceSubtotalAdded
    );
    
    addRateGuarantees(benefitData, carriers);
    
    // Add placeholder if no data
    if (Object.keys(benefitData).length === 0 && carriers.length > 0) {
      benefitData["No Benefits Data Available"] = {
        values: carriers.map(() => ({
          volume: "",
          unitRate: "",
          monthlyPremium: "",
        })),
      };
      
      if (benefitData["No Benefits Data Available"].values.length > 0) {
        benefitData["No Benefits Data Available"].values[0].monthlyPremium = "No data found";
      }
    }
    
    return benefitData;
  }, [carriers, processResults, addTotalRows, addRateGuarantees]);
  
  /**
   * Define sort order for special rows
   */
  const specialRowOrder: Record<string, number> = {
    'Pooled Benefits Subtotal': 1000,
    'Experience Rated Benefits Subtotal': 2000,
    'Grand Total': 3000,
    'Rate Guarantees': 4000,
  };

  /**
   * Order benefits for display in a logical sequence
   */
  const orderedBenefits = useMemo(() => {
    return Object.keys(benefitDataMap).sort((a, b) => {
      const orderA = specialRowOrder[a] || 0;
      const orderB = specialRowOrder[b] || 0;
      
      // If both have special orders, sort by order
      if (orderA && orderB) {
        return orderA - orderB;
      }
      
      // If only one has special order, it goes after regular items
      if (orderA) {
        return 1;
      }
      if (orderB) {
        return -1;
      }
      
      // Default to alphabetical sorting for regular items
      return a.localeCompare(b);
    });
  }, [benefitDataMap]);

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Benefit</TableHead>
              {carriers.map((carrier, index) => {
                const selectedPlan = selectedPlanOptions[carrier.name];
                const availableOptions = carrierPlanOptions[carrier.name] || [];
                
                return (
                  <TableHead
                    key={`header-carrier-${index}`}
                    className="text-center"
                    colSpan={3}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {carrier.name || 'Unknown Carrier'}
                      </span>
                      {selectedPlan && (
                        <span className="text-xs text-muted-foreground font-normal">
                          {selectedPlan}
                          {availableOptions.length > 1 && (
                            <span className="ml-1">
                              (1 of {availableOptions.length})
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
            <TableRow>
              <TableHead />
              {carriers.map((_, index) => (
                <React.Fragment key={`subheader-${index}`}>
                  <TableHead className="text-center">Volume</TableHead>
                  <TableHead className="text-center">Unit Rate</TableHead>
                  <TableHead className="text-center">Monthly Premium</TableHead>
                </React.Fragment>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderedBenefits.map((benefitKey) => {
              const benefit = benefitDataMap[benefitKey] || { 
                values: [], 
                isSubtotal: false, 
                isTotal: false, 
                isRateGuarantee: false 
              };
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
                <TableRow key={`benefit-${benefitKey}`} className={rowClassName}>
                  <TableCell>{benefitKey}</TableCell>
                  {carriers.map((_, carrierIndex) => (
                    <React.Fragment
                      key={`benefit-${benefitKey}-carrier-${carrierIndex}`}
                    >
                      <TableCell className="text-center">
                        {!isSubtotal && !isTotal && !isRateGuarantee
                          ? benefit.values[carrierIndex]?.volume
                          : ""}
                      </TableCell>
                      <TableCell className="text-center">
                        {!isSubtotal && !isTotal && !isRateGuarantee
                          ? benefit.values[carrierIndex]?.unitRate
                          : ""}
                      </TableCell>
                      <TableCell className="text-center">
                        {benefit.values[carrierIndex]?.monthlyPremium || ""}
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
