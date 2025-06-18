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
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Edit2, Save, FileDown, Plus, RotateCcw, Pencil, RotateCw, Type, Minus, Star, TrendingUp, RefreshCw, Target } from 'lucide-react';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Import ParsedDocumentResult and Coverage types
import type { ParsedDocumentResult, Coverage, HighLevelOverview } from '../../../types';

// Custom hook for history state management (similar to useHistoryState)
function useHistoryState<T>(initialState: T) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const state = history[currentIndex];

  const setState = (newState: T | ((prevState: T) => T)) => {
    const resolvedState = typeof newState === 'function' ? (newState as (prevState: T) => T)(state) : newState;
    
    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(resolvedState);
    
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  };

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const undo = () => {
    if (canUndo) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const redo = () => {
    if (canRedo) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return {
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

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
  highLevelOverview?: HighLevelOverview[];
}

// Editable Table Cell Component
interface EditableTableCellProps {
  value: string;
  onUpdate: (value: string) => void;
  isNumeric?: boolean;
  className?: string;
  isCurrency?: boolean;
  isEditMode?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
}

const EditableTableCell: React.FC<EditableTableCellProps> = ({ 
  value, 
  onUpdate, 
  isNumeric = false,
  className = '',
  isCurrency = false,
  isEditMode = false,
  fontSize = 'medium'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // For currency values, strip the $ for editing but keep the number
  const getEditValue = (val: string) => {
    if (isCurrency && val.startsWith('$')) {
      return val.replace(/[$,]/g, '');
    }
    return val;
  };
  
  // For currency values, ensure $ is prepended when saving
  const getSaveValue = (val: string) => {
    if (isCurrency && val !== '-' && val !== '') {
      const numericValue = val.replace(/[^0-9.-]/g, '');
      if (numericValue && !isNaN(Number(numericValue))) {
        return formatCurrency(Number(numericValue));
      }
    }
    return val;
  };

  const [tempValue, setTempValue] = useState(getEditValue(value));

  const handleBlur = () => {
    setIsEditing(false);
    const savedValue = getSaveValue(tempValue);
    onUpdate(savedValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      const savedValue = getSaveValue(tempValue);
      onUpdate(savedValue);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempValue(getEditValue(value));
    }
  };

  // Update tempValue when value prop changes
  React.useEffect(() => {
    setTempValue(getEditValue(value));
  }, [value, isCurrency]);

  if (isEditing) {
    return (
      <div className="relative">
        {isCurrency && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">$</span>}
        <input
          type="text"
          value={tempValue}
          onChange={(e) => {
            if (isNumeric) {
              const val = e.target.value.replace(/[^0-9.,\-]/g, '');
              setTempValue(val);
            } else {
              setTempValue(e.target.value);
            }
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full ${isCurrency ? 'pl-6' : 'pl-2'} pr-2 py-1 ${fontSize === 'large' ? 'text-base' : fontSize === 'medium' ? 'text-sm' : 'text-xs'} border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          autoFocus
        />
      </div>
    );
  }

  return (
    <div 
      className={`group relative ${isEditMode ? 'cursor-pointer hover:bg-blue-50' : ''} rounded px-2 py-1`}
      onClick={() => isEditMode && setIsEditing(true)}
    >
      <span className={`${fontSize === 'large' ? 'text-base' : fontSize === 'medium' ? 'text-sm' : 'text-xs'} ${className}`}>{value}</span>
      {isEditMode && (
        <Edit2 className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
};

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
  highLevelOverview,
}: PremiumComparisonTableProps): React.ReactElement {
  const router = useRouter();

  // State for per-carrier plan option selection
  const [selectedPlanOptions, setSelectedPlanOptions] = useState<Record<string, string>>({});
  
  // History state management for edited values
  const {
    state: editedValues,
    setState: setEditedValues,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistoryState<Record<string, any>>({});
  
  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  
  // State for action feedback
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  
  // State for font size
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  
  // State for comparison type
  const [comparisonType, setComparisonType] = useState<'current-vs-negotiated' | 'current-vs-alternative' | 'current-vs-go-to-market' | 'all'>('all');

  // Helper function to get plan quote type for a specific coverage
  const getPlanQuoteType = useCallback((result: ParsedDocumentResult, coverage: Coverage): string => {
    // Check multiple locations for plan quote types (from plan selection)
    let planQuoteTypes = (result as any).planQuoteTypes;
    
    // Also check in quoteMeta if it exists
    if (!planQuoteTypes && (result as any).quoteMeta?.planQuoteTypes) {
      planQuoteTypes = (result as any).quoteMeta.planQuoteTypes;
    }
    
    if (planQuoteTypes && coverage.planOptionName) {
      const quoteType = planQuoteTypes[coverage.planOptionName];
      if (quoteType) {
        console.log('[DEBUG] Found plan quote type:', {
          carrierName: coverage.carrierName,
          planOptionName: coverage.planOptionName,
          quoteType: quoteType,
          source: 'planQuoteTypes'
        });
        return quoteType;
      }
    }
    
    // Fallback to document category
    const documentCategory = (result as any).category || 
                           (result as any).metadata?.fileCategory || 
                           (result as any).processedData?.metadata?.fileCategory ||
                           'Current';
    
    console.log('[DEBUG] Using document category fallback:', {
      carrierName: coverage.carrierName,
      planOptionName: coverage.planOptionName,
      documentCategory: documentCategory,
      availablePlanQuoteTypes: planQuoteTypes ? Object.keys(planQuoteTypes) : 'none',
      source: 'documentCategory'
    });
    
    return documentCategory;
  }, []);

  // Helper function to get document category (fallback when plan quote types aren't available)
  const getDocumentCategory = useCallback((result: ParsedDocumentResult): string => {
    return (result as any).category || 
           (result as any).metadata?.fileCategory || 
           (result as any).processedData?.metadata?.fileCategory ||
           'Current';
  }, []);

  // Helper function to get visual styling for quote types
  const getQuoteTypeStyle = useCallback((quoteType: string) => {
    switch (quoteType) {
      case 'Current':
        return {
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Star className="h-3 w-3" />,
          headerBg: 'bg-blue-50',
          columnBg: 'bg-blue-50/30'
        };
      case 'Go To Market':
        return {
          badge: 'bg-green-100 text-green-800 border-green-200',
          icon: <Target className="h-3 w-3" />,
          headerBg: 'bg-green-50',
          columnBg: 'bg-green-50/30'
        };
      case 'Alternative':
        return {
          badge: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <TrendingUp className="h-3 w-3" />,
          headerBg: 'bg-purple-50',
          columnBg: 'bg-purple-50/30'
        };
      case 'Negotiated':
        return {
          badge: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: <RefreshCw className="h-3 w-3" />,
          headerBg: 'bg-orange-50',
          columnBg: 'bg-orange-50/30'
        };
      default:
        return {
          badge: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Edit2 className="h-3 w-3" />,
          headerBg: 'bg-gray-50',
          columnBg: 'bg-gray-50/30'
        };
    }
  }, []);

  // Filter results based on comparison type
  const filteredResults = useMemo(() => {
    if (comparisonType === 'all') {
      return results;
    }
    
    return results.filter(result => {
      // Check if this result has any plans with the required quote types
      let planQuoteTypes = (result as any).planQuoteTypes || {};
      
      // Also check in quoteMeta if it exists
      if (Object.keys(planQuoteTypes).length === 0 && (result as any).quoteMeta?.planQuoteTypes) {
        planQuoteTypes = (result as any).quoteMeta.planQuoteTypes;
      }
      
      const quoteTypesInResult = Object.values(planQuoteTypes) as string[];
      
      // If no plan quote types, fall back to document category
      if (quoteTypesInResult.length === 0) {
        const category = getDocumentCategory(result);
        
        if (comparisonType === 'current-vs-negotiated') {
          return category === 'Current' || category === 'Renegotiated';
        } else if (comparisonType === 'current-vs-alternative') {
          return category === 'Current' || category === 'Alternative';
        } else if (comparisonType === 'current-vs-go-to-market') {
          return category === 'Current';
        }
        
        return true;
      }
      
      // Filter based on plan quote types
      if (comparisonType === 'current-vs-negotiated') {
        return quoteTypesInResult.includes('Current') || quoteTypesInResult.includes('Negotiated');
      } else if (comparisonType === 'current-vs-alternative') {
        return quoteTypesInResult.includes('Current') || quoteTypesInResult.includes('Alternative');
      } else if (comparisonType === 'current-vs-go-to-market') {
        return quoteTypesInResult.includes('Current') || quoteTypesInResult.includes('Go To Market');
      }
      
      return true;
    });
  }, [results, comparisonType, getDocumentCategory]);
  
  // Font size helper functions
  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-xs';
      case 'medium': return 'text-sm';
      case 'large': return 'text-base';
      default: return 'text-sm';
    }
  };
  
  const increaseFontSize = () => {
    setFontSize(prev => {
      if (prev === 'small') return 'medium';
      if (prev === 'medium') return 'large';
      return 'large';
    });
  };
  
  const decreaseFontSize = () => {
    setFontSize(prev => {
      if (prev === 'large') return 'medium';
      if (prev === 'medium') return 'small';
      return 'small';
    });
  };

  // Extract plan options per carrier-plan-quote-type combination
  const carrierPlanOptions = useMemo(() => {
    const carrierOptions: Record<string, string[]> = {};

    for (const result of filteredResults) {
      if (result?.allCoverages) {
        // Get selected plans for this document
        const selectedPlans = (result as any).selectedPlans || [];
        const plansToProcess = selectedPlans.length > 0 ? selectedPlans : 
                             result.allCoverages.map(c => c.planOptionName).filter(Boolean);

        for (const planName of plansToProcess) {
          const planCoverage = result.allCoverages.find(c => c.planOptionName === planName);
          if (planCoverage && planCoverage.carrierName) {
            const quoteType = getPlanQuoteType(result, planCoverage);
            const uniqueKey = `${planCoverage.carrierName}-${planName}-${quoteType}`;
            
            if (!carrierOptions[uniqueKey]) {
              carrierOptions[uniqueKey] = [];
            }
            if (!carrierOptions[uniqueKey].includes(planName)) {
              carrierOptions[uniqueKey].push(planName);
            }
          }
        }
      }
    }
    
    return carrierOptions;
  }, [filteredResults, getPlanQuoteType]);

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
    // Try to get carrier name from multiple sources
    const carrierName = result.metadata?.carrierName || 
                       (result as any).processedData?.metadata?.carrierName ||
                       result.allCoverages?.[0]?.carrierName;
    
    if (!carrierName) {
      extractCarriersFromCoverages(result, carriersMap);
      return;
    }
    
    // Try multiple sources for rate guarantee information in priority order
    let rateGuaranteeText: string | null = null;
    
    // 1. Check new format processedData.metadata.rateGuarantees
    if ((result as any).processedData?.metadata?.rateGuarantees) {
      rateGuaranteeText = extractRateGuarantee((result as any).processedData.metadata.rateGuarantees);
    }
    
    // 2. Check old format metadata.rateGuarantees
    if (!rateGuaranteeText && result.metadata?.rateGuarantees) {
      rateGuaranteeText = extractRateGuarantee(result.metadata.rateGuarantees);
    }
    
    // 3. Check new format planOptions with carrierProposals
    if (!rateGuaranteeText && (result as any).processedData?.planOptions) {
      for (const planOption of (result as any).processedData.planOptions) {
        if (planOption.carrierProposals) {
          for (const carrierProposal of planOption.carrierProposals) {
            if (carrierProposal.carrierName === carrierName && carrierProposal.rateGuaranteeText) {
              rateGuaranteeText = carrierProposal.rateGuaranteeText;
              break;
            }
          }
        }
        if (rateGuaranteeText) break;
      }
    }
    
    // 4. Check old format planOptions
    if (!rateGuaranteeText && result.planOptions) {
      for (const planOption of result.planOptions) {
        if (planOption.rateGuarantees && planOption.rateGuarantees.length > 0) {
          rateGuaranteeText = extractRateGuarantee(planOption.rateGuarantees);
          break;
        }
      }
    }
    
    // 5. Check documentNotes (new format)
    if (!rateGuaranteeText && (result as any).processedData?.documentNotes) {
      const documentNotes = (result as any).processedData.documentNotes;
      if (typeof documentNotes === 'string' && documentNotes.toLowerCase().includes('rate guarantee')) {
        rateGuaranteeText = documentNotes;
      }
    }
    
    // 6. Check documentNotes (root level)
    if (!rateGuaranteeText && (result as any).documentNotes) {
      const documentNotes = (result as any).documentNotes;
      if (typeof documentNotes === 'string' && documentNotes.toLowerCase().includes('rate guarantee')) {
        rateGuaranteeText = documentNotes;
      }
    }
    
    // 7. Check old format planNotes
    if (!rateGuaranteeText && result.planNotes) {
      for (const note of result.planNotes) {
        const noteText = typeof note === 'string' ? note : note.note || '';
        if (noteText.toLowerCase().includes('rate guarantee')) {
          rateGuaranteeText = noteText;
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
   * Extract unique carrier-plan combinations from results - initially unsorted
   */
  const unsortedCarriers = useMemo<Array<{
    name: string;
    rateGuarantee: string | null;
    quoteType: string;
    planName: string;
    displayName: string;
  }>>(() => {
    if (!filteredResults || filteredResults.length === 0) {
      return [{ name: 'No Data Available', rateGuarantee: null, quoteType: 'Current', planName: 'Default', displayName: 'No Data Available' }];
    }
    
    const carriersMap = new Map<string, { name: string; rateGuarantee: string | null; quoteType: string; planName: string; displayName: string }>();
    
    for (const result of filteredResults) {
      const carrierName = result.metadata?.carrierName || 
                         (result as any).processedData?.metadata?.carrierName ||
                         result.allCoverages?.[0]?.carrierName;
      
      if (!carrierName || !result.allCoverages) continue;
      
      // Get selected plans for this document
      const selectedPlans = (result as any).selectedPlans || [];
      
      // Get plan quote types from multiple possible locations
      let planQuoteTypes = (result as any).planQuoteTypes || {};
      if (Object.keys(planQuoteTypes).length === 0 && (result as any).quoteMeta?.planQuoteTypes) {
        planQuoteTypes = (result as any).quoteMeta.planQuoteTypes;
      }
      
      // If no plans are selected, use all plans
      const plansToProcess = selectedPlans.length > 0 ? selectedPlans : 
                           result.allCoverages.map(c => c.planOptionName).filter(Boolean);
      
      for (const planName of plansToProcess) {
        if (!planName) continue;
        
        // Find a coverage for this plan to get the quote type
        const planCoverage = result.allCoverages.find(c => c.planOptionName === planName);
        if (!planCoverage) continue;
        
        // Get quote type directly from plan quote types if available, otherwise use getPlanQuoteType
        let quoteType = planQuoteTypes[planName];
        if (!quoteType) {
          quoteType = getPlanQuoteType(result, planCoverage);
        }
        const uniqueKey = `${carrierName}-${planName}-${quoteType}`;
        const displayName = quoteType === 'Current' ? carrierName : `${carrierName} (${quoteType})`;
        
        // Get rate guarantee
        let rateGuaranteeText: string | null = null;
        if ((result as any).processedData?.metadata?.rateGuarantees) {
          rateGuaranteeText = extractRateGuarantee((result as any).processedData.metadata.rateGuarantees);
        } else if (result.metadata?.rateGuarantees) {
          rateGuaranteeText = extractRateGuarantee(result.metadata.rateGuarantees);
        }
        
        if (!carriersMap.has(uniqueKey)) {
          carriersMap.set(uniqueKey, {
            name: carrierName,
            rateGuarantee: rateGuaranteeText,
            quoteType: quoteType,
            planName: planName,
            displayName: displayName
          });
        }
      }
    }
    
    if (carriersMap.size === 0) {
      return [{ name: 'No Carrier Data', rateGuarantee: null, quoteType: 'Current', planName: 'Default', displayName: 'No Carrier Data' }];
    }
    
    const carriersArray = Array.from(carriersMap.values());
    console.log('[DEBUG] Extracted carrier-plan combinations:', carriersArray);
    
    return carriersArray;
  }, [filteredResults, getPlanQuoteType, extractRateGuarantee]);

  // Set default selected plan options when carriers change
  React.useEffect(() => {
    const newSelectedOptions: Record<string, string> = {};
    let hasChanges = false;
    
    unsortedCarriers.forEach(carrier => {
      const uniqueKey = `${carrier.name}-${carrier.planName}-${carrier.quoteType}`;
      const availableOptions = carrierPlanOptions[uniqueKey] || [];
      if (availableOptions.length > 0) {
        // If not already set, use the first available option
        if (!selectedPlanOptions[uniqueKey]) {
          newSelectedOptions[uniqueKey] = availableOptions[0];
          hasChanges = true;
        } else {
          newSelectedOptions[uniqueKey] = selectedPlanOptions[uniqueKey];
        }
      }
    });
    
    // Only update if there are actual changes
    if (hasChanges) {
      setSelectedPlanOptions(newSelectedOptions);
    }
  }, [unsortedCarriers, carrierPlanOptions]);

  // Function to update plan option for a specific carrier-category combination
  const updateCarrierPlanOption = useCallback((carrierKey: string, planOption: string) => {
    setSelectedPlanOptions(prev => ({
      ...prev,
      [carrierKey]: planOption
    }));
  }, []);

  // Helper function to get edited value or default
  const getEditedValue = useCallback((key: string, defaultValue: any) => {
    return editedValues[key] !== undefined ? editedValues[key] : defaultValue;
  }, [editedValues]);

  // Helper function to update edited value
  const updateEditedValue = useCallback((key: string, value: any) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
  }, [setEditedValues]);

  // Enhanced undo with feedback
  const handleUndo = () => {
    undo();
    setActionFeedback('Undid last change');
    setTimeout(() => setActionFeedback(null), 2000);
  };

  // Enhanced redo with feedback
  const handleRedo = () => {
    redo();
    setActionFeedback('Redid last change');
    setTimeout(() => setActionFeedback(null), 2000);
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) handleRedo();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo]);

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
   * Filter coverages by plan option for a specific carrier-category combination
   */
  const filterCoveragesByCarrierPlan = useCallback((
    coverages: Coverage[] | undefined, 
    carrierKey: string
  ): Coverage[] => {
    if (!coverages) {
      return [];
    }
    
    const selectedPlan = selectedPlanOptions[carrierKey];
    if (!selectedPlan) {
      return coverages;
    }
    
    return coverages.filter((coverage) => 
      !coverage.planOptionName || coverage.planOptionName === selectedPlan
    );
  }, [selectedPlanOptions]);

  /**
   * Calculate total premiums for carrier-category combinations (to be used for sorting)
   */
  const calculateCarrierTotals = useMemo(() => {
    if (!filteredResults || filteredResults.length === 0 || unsortedCarriers.length === 0) {
      return new Map<string, number>();
    }

    const carriersLength = unsortedCarriers.length;
    const grandTotal = new Array(carriersLength).fill(0);

    // Create a quick-access map of all coverages for performance.
    const processedCoverages = new Map<string, Coverage>();
    
    for (const result of filteredResults) {
      const carrierName = result.metadata?.carrierName || result.allCoverages?.[0]?.carrierName;
      if (!carrierName) continue;
      
      // Find matching carrier entries for this result
      const matchingCarriers = unsortedCarriers.filter(c => c.name === carrierName);
      
      for (const carrierEntry of matchingCarriers) {
        const uniqueKey = `${carrierName}-${carrierEntry.planName}-${carrierEntry.quoteType}`;
        const filteredCoverages = filterCoveragesByCarrierPlan(result.allCoverages, uniqueKey);

        for (const coverage of filteredCoverages) {
          // Only include coverages that match this carrier's plan
          if (coverage.planOptionName === carrierEntry.planName) {
            const normalizedType = getNormalizedCoverageType(coverage.coverageType);
            const key = `${carrierName}-${carrierEntry.planName}-${carrierEntry.quoteType}-${normalizedType}`;
            processedCoverages.set(key, coverage);
          }
        }
      }
    }

    // Calculate grand totals for each carrier-plan-quote type combination using the same logic as the table
    unsortedCarriers.forEach((carrier, idx) => {
      // Sum all coverage premiums for this carrier-plan-quote type combination
      for (const key of masterBenefitOrder) {
        if (!key.startsWith('HEADER-') && !key.startsWith('Subtotal-') && key !== 'Grand Total' && key !== 'Rate Guarantees') {
          if (key.includes('-Single') || key.includes('-Family')) {
            // Handle Single/Family sub-rows
            const [baseType, variant] = key.split('-');
            const coverage = processedCoverages.get(`${carrier.name}-${carrier.planName}-${carrier.quoteType}-${baseType}`);
            if (coverage) {
              let premium = 0;
              if (variant === 'Single') {
                const singleLives = (coverage as any).livesSingle || 0;
                const singleRate = (coverage as any).premiumPerSingle || 0;
                premium = singleRate * singleLives;
              } else {
                const familyLives = (coverage as any).livesFamily || 0;
                const familyRate = (coverage as any).premiumPerFamily || 0;
                premium = familyRate * familyLives;
              }
              const numericPremium = parseNumericValue(premium);
              if (numericPremium > 0) {
                grandTotal[idx] += numericPremium;
              }
            }
          } else {
            // Handle standard benefit rows
            const coverage = processedCoverages.get(`${carrier.name}-${carrier.planName}-${carrier.quoteType}-${key}`);
            if (coverage) {
              const numericPremium = parseNumericValue(coverage.monthlyPremium);
              if (numericPremium > 0 && key !== 'Extended Healthcare' && key !== 'Dental Care') {
                grandTotal[idx] += numericPremium;
              }
            }
          }
        }
      }
    });

    // Return map of carrier-plan-quote type combination to total premium
    const totalsMap = new Map<string, number>();
    unsortedCarriers.forEach((carrier, idx) => {
      const uniqueKey = `${carrier.name}-${carrier.planName}-${carrier.quoteType}`;
      totalsMap.set(uniqueKey, grandTotal[idx]);
    });

    return totalsMap;
  }, [filteredResults, unsortedCarriers, filterCoveragesByCarrierPlan, getNormalizedCoverageType, parseNumericValue, getDocumentCategory]);

  /**
   * Sort carrier-plan combinations with Current quote type first, then by premium
   */
  const carriers = useMemo<Array<{
    name: string;
    rateGuarantee: string | null;
    quoteType: string;
    planName: string;
    displayName: string;
  }>>(() => {
    if (unsortedCarriers.length === 0) {
      return unsortedCarriers;
    }
    
    // Sort carriers with Current quote type first, then by premium
    return unsortedCarriers.sort((a, b) => {
      // Prioritize Current quote type first
      if (a.quoteType === 'Current' && b.quoteType !== 'Current') return -1;
      if (b.quoteType === 'Current' && a.quoteType !== 'Current') return 1;
      
      // Then sort by premium within each quote type
      const uniqueKeyA = `${a.name}-${a.planName}-${a.quoteType}`;
      const uniqueKeyB = `${b.name}-${b.planName}-${b.quoteType}`;
      const totalA = calculateCarrierTotals.get(uniqueKeyA) || 0;
      const totalB = calculateCarrierTotals.get(uniqueKeyB) || 0;
      
      // If both have premiums, sort by premium amount
      if (totalA > 0 && totalB > 0) {
        return totalA - totalB;
      }
      
      // If only one has premium data, put it first
      if (totalA > 0) return -1;
      if (totalB > 0) return 1;
      
      // If neither has premium data, sort alphabetically
      return a.displayName.localeCompare(b.displayName);
    });
  }, [unsortedCarriers, calculateCarrierTotals]);

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
    for (const result of filteredResults) {
      const carrierName = result.metadata?.carrierName || result.allCoverages?.[0]?.carrierName;
      if (!carrierName) continue;
      
      // Find matching carrier entries for this result
      const matchingCarriers = carriers.filter(c => c.name === carrierName);
      
      for (const carrierEntry of matchingCarriers) {
        const uniqueKey = `${carrierName}-${carrierEntry.planName}-${carrierEntry.quoteType}`;
        
        // Filter coverages to only those matching this carrier's plan
        const planCoverages = result.allCoverages?.filter(coverage => 
          coverage.planOptionName === carrierEntry.planName || !coverage.planOptionName
        ) || [];

        for (const coverage of planCoverages) {
          const normalizedType = getNormalizedCoverageType(coverage.coverageType);
          const key = `${carrierName}-${carrierEntry.planName}-${carrierEntry.quoteType}-${normalizedType}`;
          processedCoverages.set(key, coverage);
          console.log('[DEBUG] Set coverage:', {
            key: key,
            coverageType: coverage.coverageType,
            monthlyPremium: coverage.monthlyPremium,
            unitRate: coverage.unitRate
          });
        }
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
          .map(c => processedCoverages.get(`${c.name}-${c.planName}-${c.quoteType}-${baseType}`))
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
          const coverage = processedCoverages.get(`${carrier.name}-${carrier.planName}-${carrier.quoteType}-${baseType}`);
          if (coverage) {
            // Handle Single/Family variants - data is stored directly on coverage object
            let premium, rate;
            
            if (variant === 'Single') {
              // For Single: calculate total premium for all single enrollees
              const singleLives = (coverage as any).livesSingle || 0;
              const singleRate = (coverage as any).premiumPerSingle || 0;
              rate = singleRate;
              premium = singleRate * singleLives;
            } else {
              // For Family: calculate total premium for all family enrollees
              const familyLives = (coverage as any).livesFamily || 0;
              const familyRate = (coverage as any).premiumPerFamily || 0;
              rate = familyRate;
              premium = familyRate * familyLives;
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
        // Find first coverage with data for the consolidated volume column
        const firstCoverage = carriers
          .map(c => processedCoverages.get(`${c.name}-${c.planName}-${c.quoteType}-${key}`))
          .find(cov => cov);
        
        // For Dependent Life, use lives field; for others, use volume field
        let volumeValue = '-';
        if (firstCoverage) {
          if (key === 'Dependent Life' && firstCoverage.lives) {
            volumeValue = formatVolume(firstCoverage.lives);
          } else if (firstCoverage.volume) {
            volumeValue = formatVolume(firstCoverage.volume);
          }
        }
          
        const rowData = {
          key,
          type: 'benefit',
          label: key,
          volume: volumeValue,
          values: new Array(carriersLength).fill({ unitRate: '-', monthlyPremium: '$0.00' })
        };

        carriers.forEach((carrier, idx) => {
          const lookupKey = `${carrier.name}-${carrier.planName}-${carrier.quoteType}-${key}`;
          const coverage = processedCoverages.get(lookupKey);
          console.log('[DEBUG] Looking up coverage:', {
            lookupKey: lookupKey,
            found: !!coverage,
            benefitType: key,
            carrier: carrier.displayName
          });
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
  }, [carriers, filteredResults, selectedPlanOptions, filterCoveragesByCarrierPlan, getNormalizedCoverageType, isExperienceRatedCoverage, parseNumericValue]);

  // High-level overview component
  const HighLevelOverviewSection = () => {
    if (!highLevelOverview || highLevelOverview.length === 0) {
      return null;
    }

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Plan Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {highLevelOverview.map((overview, index) => (
            <Card key={`${overview.carrierName}-${index}`} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-blue-700">
                    {overview.carrierName}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {overview.planOption}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Total Premium - Most prominent */}
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-sm text-gray-600 font-medium">Total Monthly Premium</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(overview.totalMonthlyPremium)}
                  </div>
                </div>
                
                {/* Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Pooled Benefits:</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(overview.pooledBenefitsSubtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Experience Rated:</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(overview.experienceRatedSubtotal)}
                    </span>
                  </div>
                </div>

                {/* Rate Guarantee */}
                {overview.rateGuarantee && (
                  <div className="bg-blue-50 rounded p-2">
                    <div className="text-xs font-medium text-blue-800 mb-1">Rate Guarantee</div>
                    <div className="text-xs text-blue-700">{overview.rateGuarantee}</div>
                  </div>
                )}

                {/* Key Highlights */}
                {overview.keyHighlights && (
                  <div className="bg-amber-50 rounded p-2">
                    <div className="text-xs font-medium text-amber-800 mb-1">Key Highlights</div>
                    <div className="text-xs text-amber-700">{overview.keyHighlights}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between relative">
          <CardTitle>Premium Comparison</CardTitle>
          <div className="flex items-center gap-2">
            {/* Comparison Type Toggle Buttons */}
            <div className="flex items-center gap-1 bg-white border rounded-lg shadow-sm p-1">
              <Button
                variant={comparisonType === 'all' ? "default" : "ghost"}
                size="sm"
                onClick={() => setComparisonType('all')}
                className={`h-8 px-3 text-xs font-medium transition-all duration-200 ${
                  comparisonType === 'all'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                    : 'hover:bg-gray-50 hover:text-gray-700 text-gray-600'
                }`}
                title="Show all plans"
              >
                All Plans
              </Button>
              <Button
                variant={comparisonType === 'current-vs-negotiated' ? "default" : "ghost"}
                size="sm"
                onClick={() => setComparisonType('current-vs-negotiated')}
                className={`h-8 px-3 text-xs font-medium transition-all duration-200 ${
                  comparisonType === 'current-vs-negotiated'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                    : 'hover:bg-gray-50 hover:text-gray-700 text-gray-600'
                }`}
                title="Compare current vs negotiated plans"
              >
                Current vs Negotiated
              </Button>
              <Button
                variant={comparisonType === 'current-vs-alternative' ? "default" : "ghost"}
                size="sm"
                onClick={() => setComparisonType('current-vs-alternative')}
                className={`h-8 px-3 text-xs font-medium transition-all duration-200 ${
                  comparisonType === 'current-vs-alternative'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                    : 'hover:bg-gray-50 hover:text-gray-700 text-gray-600'
                }`}
                title="Compare current vs alternative plans"
              >
                Current vs Alternative
              </Button>
              <Button
                variant={comparisonType === 'current-vs-go-to-market' ? "default" : "ghost"}
                size="sm"
                onClick={() => setComparisonType('current-vs-go-to-market')}
                className={`h-8 px-3 text-xs font-medium transition-all duration-200 ${
                  comparisonType === 'current-vs-go-to-market'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                    : 'hover:bg-gray-50 hover:text-gray-700 text-gray-600'
                }`}
                title="Compare current vs go to market plans"
              >
                Current vs Go to Market
              </Button>
            </div>
            {/* Undo/Redo buttons with enhanced UX */}
            {(canUndo || canRedo) && (
              <div className="flex items-center gap-1 bg-white border rounded-lg shadow-sm p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className={`group h-8 px-3 text-xs font-medium transition-all duration-200 ${
                    canUndo 
                      ? 'hover:bg-blue-50 hover:text-blue-700 text-gray-700 hover:shadow-sm' 
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                  title={canUndo ? "Undo last change (Ctrl+Z)" : "Nothing to undo"}
                >
                  <RotateCcw className={`h-3.5 w-3.5 mr-1.5 transition-transform duration-200 ${canUndo ? 'group-hover:-rotate-12' : ''}`} />
                  Undo
                </Button>
                <div className="w-px h-5 bg-gray-200" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className={`group h-8 px-3 text-xs font-medium transition-all duration-200 ${
                    canRedo 
                      ? 'hover:bg-blue-50 hover:text-blue-700 text-gray-700 hover:shadow-sm' 
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                  title={canRedo ? "Redo last undone change (Ctrl+Y)" : "Nothing to redo"}
                >
                  <RotateCw className={`h-3.5 w-3.5 mr-1.5 transition-transform duration-200 ${canRedo ? 'group-hover:rotate-12' : ''}`} />
                  Redo
                </Button>
              </div>
            )}
            
            {/* Action feedback */}
            {actionFeedback && (
              <div className="absolute top-12 right-0 z-50 bg-green-100 border border-green-200 text-green-800 px-3 py-2 rounded-md shadow-sm text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200">
                {actionFeedback}
              </div>
            )}
            
            {/* Font Size Controls */}
            <div className="flex items-center gap-1 bg-white border rounded-lg shadow-sm p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={decreaseFontSize}
                disabled={fontSize === 'small'}
                className={`h-8 px-2 text-xs font-medium transition-all duration-200 ${
                  fontSize !== 'small'
                    ? 'hover:bg-gray-50 hover:text-gray-700 text-gray-600' 
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                title="Decrease font size"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <div className="flex items-center px-2">
                <Type className="h-3 w-3 mr-1 text-gray-500" />
                <span className="text-xs font-medium text-gray-600 min-w-[40px] text-center">
                  {fontSize.charAt(0).toUpperCase() + fontSize.slice(1)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={increaseFontSize}
                disabled={fontSize === 'large'}
                className={`h-8 px-2 text-xs font-medium transition-all duration-200 ${
                  fontSize !== 'large'
                    ? 'hover:bg-gray-50 hover:text-gray-700 text-gray-600' 
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                title="Increase font size"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="flex items-center gap-1 bg-white border rounded-lg shadow-sm p-1">
              <Button
                variant={isEditMode ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
                className={`h-8 px-3 text-xs font-medium transition-all duration-200 ${
                  isEditMode 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                    : 'hover:bg-gray-50 hover:text-gray-700 text-gray-600'
                }`}
                title={isEditMode ? "Exit edit mode" : "Enter edit mode"}
              >
                <Pencil className="h-3 w-3 mr-1.5" />
                {isEditMode ? 'Exit Edit' : 'Edit Mode'}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <HighLevelOverviewSection />
        {highLevelOverview && highLevelOverview.length > 0 && (
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Detailed Breakdown</h3>
          </div>
        )}
        <div className="overflow-x-auto border rounded-lg shadow-sm w-full">
          <Table className={`table-fixed ${getFontSizeClass()} w-full`}>
            <TableHeader>
              <TableRow>
                <TableHead className={`${carriers.length < 3 ? 'w-[556px]' : 'w-[445px]'} sticky left-0 bg-background border-r z-20 border-b-2 border-b-sky-500 px-3 py-3`} colSpan={2}>
                  <div className={`font-semibold text-sky-600 ${fontSize === 'large' ? 'text-lg' : fontSize === 'medium' ? 'text-base' : 'text-sm'}`}>Carrier</div>
                </TableHead>
                {carriers.map((carrier, index) => {
                  const uniqueKey = `${carrier.name}-${carrier.planName}-${carrier.quoteType}`;
                  const selectedPlan = selectedPlanOptions[uniqueKey];
                  const availableOptions = carrierPlanOptions[uniqueKey] || [];
                  const style = getQuoteTypeStyle(carrier.quoteType);
                  
                  return (
                    <TableHead
                      key={`header-carrier-${index}`}
                      className={`text-center px-3 py-3 border-l border-b-2 border-b-sky-500 transition-colors duration-200 hover:bg-sky-50/50 cursor-default ${style.headerBg}`}
                      colSpan={2}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className={`font-semibold text-sky-600 text-center leading-tight ${fontSize === 'large' ? 'text-lg' : fontSize === 'medium' ? 'text-base' : 'text-sm'}`}>
                            {carrier.name || 'Unknown Carrier'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Badge variant="outline" className={`text-xs font-medium border ${style.badge}`}>
                            {style.icon}
                            <span className="ml-1">{carrier.quoteType}</span>
                          </Badge>
                        </div>
                        {carrier.planName && carrier.planName !== 'Default' && (
                          <div className="text-xs text-gray-600 font-medium">
                            {carrier.planName}
                          </div>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
              <TableRow>
                <TableHead className={`${carriers.length < 3 ? 'w-[469px]' : 'w-[375px]'} sticky left-0 bg-background border-r z-20 border-b-2 border-b-sky-500 px-3 py-3`}>
                  <div className={`font-semibold ${getFontSizeClass()}`}>Benefit</div>
                </TableHead>
                <TableHead className="border-b-2 border-b-sky-500 text-center px-3 py-3 bg-slate-100">
                  <div className={`font-semibold ${getFontSizeClass()}`}>Volume</div>
                </TableHead>
                {carriers.map((carrier, index) => {
                  const style = getQuoteTypeStyle(carrier.quoteType);
                  return (
                    <React.Fragment key={`subheader-${index}`}>
                      <TableHead className={`text-center border-l border-b-2 border-b-sky-500 px-3 py-3 w-[100px] min-w-[100px] max-w-[100px] ${style.headerBg} ${getFontSizeClass()}`}>Unit Rate</TableHead>
                      <TableHead className={`text-center border-b-2 border-b-sky-500 px-3 py-3 w-[150px] min-w-[150px] max-w-[150px] ${style.headerBg} ${getFontSizeClass()}`}>Monthly Premium</TableHead>
                    </React.Fragment>
                  );
                })}
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
                rowClassName = `${row.isBold ? 'font-bold' : 'font-medium'} bg-blue-200 border-t border-t-blue-300`;
              } else if (row.type === 'subBenefit') {
                rowClassName = 'hover:bg-blue-50/50 transition-colors duration-200 cursor-pointer';
              } else {
                rowClassName = 'hover:bg-blue-50/50 transition-colors duration-200 cursor-pointer';
              }
              
              // Enhanced styling for header rows
              if (row.type === 'header') {
                return (
                  <TableRow key={`row-${index}-${row.label}`}>
                    <TableCell className={`font-bold border-y bg-muted/30 py-3 sticky left-0 z-10 ${getFontSizeClass()}`} colSpan={2 + carriers.length * 2}>
                      <div className={`break-words leading-relaxed ${getFontSizeClass()}`}>{row.label}</div>
                    </TableCell>
                  </TableRow>
                );
              }
              
              if (row.type === 'rateGuarantee') {
                // Special rendering for Rate Guarantees row with proper spanning
                return (
                  <TableRow key={`row-${index}-${row.label}`} className={rowClassName}>
                    <TableCell className={`${carriers.length < 3 ? 'w-[556px]' : 'w-[445px]'} sticky left-0 bg-background border-r z-10 px-3 py-3 align-top ${row.isBold ? 'font-bold' : 'font-medium'}`} colSpan={2}>
                      <div className="text-sm break-words leading-relaxed">{row.label}</div>
                    </TableCell>
                    {carriers.map((carrier, carrierIndex) => {
                      const carrierStyle = getQuoteTypeStyle(carrier.quoteType);
                      return (
                      <TableCell
                        key={`rate-guarantee-${carrierIndex}`}
                        colSpan={2}
                        className={`text-center px-3 py-3 border-l align-top ${carrierStyle.columnBg}`}
                      >
                        <div className={`break-words leading-relaxed ${row.isBold ? `${getFontSizeClass()} font-bold` : getFontSizeClass()}`}>
                          <span className="text-slate-600">
                            {row.values && row.values[carrierIndex]?.monthlyPremium || '-'}
                          </span>
                        </div>
                      </TableCell>
                    )})}
                  </TableRow>
                );
              }
              
              return (
                <TableRow key={`row-${index}-${row.label}`} className={rowClassName}>
                  {row.label === 'Sub-total - Pooled Coverage' || row.label === 'Sub-total - Experience Rated Benefits' || row.label === 'TOTAL MONTHLY PREMIUM*' ? (
                    <TableCell className={`${carriers.length < 3 ? 'w-[556px]' : 'w-[445px]'} sticky left-0 border-r z-10 px-3 py-3 align-top ${row.type === 'subtotal' ? 'bg-blue-200' : row.type === 'total' ? 'bg-muted' : 'bg-background'} ${row.type === 'subBenefit' ? 'pl-6' : row.type === 'total' ? 'font-bold' : row.isBold ? 'font-bold' : row.type === 'subtotal' ? 'font-medium' : 'font-medium'}`} colSpan={2}>
                      <div className={`break-words leading-relaxed ${getFontSizeClass()}`}>
                        {row.label}
                      </div>
                    </TableCell>
                  ) : (
                    <>
                      <TableCell className={`${carriers.length < 3 ? 'w-[469px]' : 'w-[375px]'} sticky left-0 border-r z-10 px-3 py-3 align-top ${row.type === 'subtotal' ? 'bg-blue-200 hover:bg-blue-300' : row.type === 'total' ? 'bg-muted hover:bg-muted' : 'bg-background hover:bg-blue-50/50'} ${row.type === 'subBenefit' ? 'pl-6' : row.type === 'total' ? 'font-bold' : row.isBold ? 'font-bold' : row.type === 'subtotal' ? 'font-medium' : 'font-medium'} transition-colors duration-200`}>
                        <div className={`break-words leading-relaxed ${getFontSizeClass()}`}>
                          {row.label}
                        </div>
                      </TableCell>
                      <TableCell className={`text-center px-3 py-3 align-top ${row.type === 'subtotal' ? 'bg-blue-200 hover:bg-blue-300' : row.type === 'total' ? 'bg-muted hover:bg-muted' : 'bg-slate-100 hover:bg-blue-50/50'} transition-colors duration-200`}>
                        {(row.type === 'benefit' || row.type === 'subBenefit') && row.volume && row.volume !== '-' ? (
                          <EditableTableCell
                            value={getEditedValue(`${row.key}-volume`, row.volume || '-')}
                            onUpdate={(value) => updateEditedValue(`${row.key}-volume`, value)}
                            isNumeric={true}
                            isEditMode={isEditMode}
                            fontSize={fontSize}
                          />
                        ) : (
                          <div className={`break-words leading-relaxed ${getFontSizeClass()}`}>
                            {row.type !== 'subtotal' && 
                             row.type !== 'total' && 
                             row.type !== 'rateGuarantee' && 
                             row.type !== 'header'
                              ? row.volume || '-'
                              : "-"}
                          </div>
                        )}
                      </TableCell>
                    </>
                  )}
                  {row.values && Array.isArray(row.values) ? row.values.map((cell: any, cellIdx: number) => {
                    const carrierStyle = getQuoteTypeStyle(carriers[cellIdx]?.quoteType || 'Current');
                    const baseColumnBg = row.type === 'subtotal' ? 'bg-blue-200' : row.type === 'total' ? 'bg-muted' : carrierStyle.columnBg;
                    const hoverColumnBg = row.type === 'subtotal' ? 'hover:bg-blue-300' : row.type === 'total' ? 'hover:bg-muted' : cellIdx % 2 === 1 ? 'bg-slate-100 hover:bg-blue-50/50' : 'hover:bg-blue-50/50';
                    
                    return (
                    <React.Fragment key={`${row.key}-${cellIdx}`}>
                      <TableCell className={`text-center px-3 py-3 align-top border-l ${baseColumnBg} ${hoverColumnBg} transition-colors duration-200`}>
                        {(row.type === 'benefit' || row.type === 'subBenefit') && cell?.unitRate && cell.unitRate !== '-' ? (
                          <EditableTableCell
                            value={getEditedValue(`${row.key}-${cellIdx}-unitRate`, cell?.unitRate || '-')}
                            onUpdate={(value) => updateEditedValue(`${row.key}-${cellIdx}-unitRate`, value)}
                            isNumeric={true}
                            isEditMode={isEditMode}
                            fontSize={fontSize}
                          />
                        ) : (
                          <div className={`break-words leading-relaxed ${getFontSizeClass()}`}>
                            {row.type !== 'subtotal' && 
                             row.type !== 'total' && 
                             row.type !== 'rateGuarantee' && 
                             row.type !== 'header'
                              ? cell?.unitRate || '-'
                              : ""}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className={`text-center px-3 py-3 align-top ${baseColumnBg} ${hoverColumnBg} transition-colors duration-200`}>
                        {(row.type === 'benefit' || row.type === 'subBenefit' || row.type === 'subtotal' || row.type === 'total') && cell?.monthlyPremium && cell.monthlyPremium !== '-' ? (
                          <EditableTableCell
                            value={getEditedValue(`${row.key}-${cellIdx}-premium`, cell?.monthlyPremium || '-')}
                            onUpdate={(value) => updateEditedValue(`${row.key}-${cellIdx}-premium`, value)}
                            isNumeric={true}
                            isCurrency={true}
                            className={`${row.type === 'total' ? 'font-bold' : row.isBold ? 'font-bold' : 'font-medium'} ${cell?.monthlyPremium && cell.monthlyPremium !== '-' && parseNumericValue(cell.monthlyPremium) > 1000 ? 'text-slate-700' : ''}`}
                            isEditMode={isEditMode}
                            fontSize={fontSize}
                          />
                        ) : (
                          <div className={`break-words leading-relaxed ${row.type === 'total' ? `${fontSize === 'large' ? 'text-lg' : fontSize === 'medium' ? 'text-base' : 'text-sm'} font-bold` : row.isBold ? `${getFontSizeClass()} font-bold` : `${getFontSizeClass()} font-medium`}`}>
                            {row.type !== 'header' ? (
                              <span className={`${cell?.monthlyPremium && cell.monthlyPremium !== '-' && parseNumericValue(cell.monthlyPremium) > 1000 ? 'text-slate-700' : ''}`}>
                                {cell?.monthlyPremium || '-'}
                              </span>
                            ) : "-"}
                          </div>
                        )}
                      </TableCell>
                    </React.Fragment>
                  )}) : (
                    // Fallback for rows without values array
                    carriers.map((_, cellIdx) => {
                      const carrierStyle = getQuoteTypeStyle(carriers[cellIdx]?.quoteType || 'Current');
                      const baseColumnBg = row.type === 'total' ? 'bg-muted' : carrierStyle.columnBg;
                      const hoverColumnBg = row.type === 'total' ? 'hover:bg-muted' : cellIdx % 2 === 1 ? 'bg-slate-100 hover:bg-blue-50/50' : 'hover:bg-blue-50/50';
                      
                      return (
                      <React.Fragment key={`${row.key}-empty-${cellIdx}`}>
                        <TableCell className={`text-center px-3 py-3 align-top border-l ${baseColumnBg} ${hoverColumnBg} transition-colors duration-200`}>
                          <div className={getFontSizeClass()}>-</div>
                        </TableCell>
                        <TableCell className={`text-center px-3 py-3 align-top ${baseColumnBg} ${hoverColumnBg} transition-colors duration-200`}>
                          <div className={`${row.type === 'total' ? `${fontSize === 'large' ? 'text-lg' : fontSize === 'medium' ? 'text-base' : 'text-sm'} font-bold` : getFontSizeClass()}`}>-</div>
                        </TableCell>
                      </React.Fragment>
                    )})
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