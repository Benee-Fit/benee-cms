import React, { useState, useEffect, useRef } from 'react';
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
import { ChevronRight, ChevronDown, ChevronUp, ChevronLeft, Search, X, Edit2, Trash2, GripVertical, RotateCcw, RotateCw } from 'lucide-react';
import { Input } from '@repo/design-system/components/ui/input';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Using shared ParsedDocument type from types.ts

interface PlanComparisonTabProps {
  results: ParsedDocument[];
}

// State interface for history management
interface TableState {
  fieldOrder: string[];
  hiddenFields: Set<string>;
  customFieldNames: Record<string, string>;
}

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

// Type for benefit details which can be string, number, boolean, or nested object with those types
type BenefitDetail = string | number | boolean | null | { [key: string]: BenefitDetail };

// Editable Table Cell Component
interface EditableTableCellProps {
  value: string;
  onUpdate: (value: string) => void;
  className?: string;
}

const EditableTableCell: React.FC<EditableTableCellProps> = ({ 
  value, 
  onUpdate, 
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleBlur = () => {
    setIsEditing(false);
    onUpdate(tempValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      onUpdate(tempValue);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempValue(value);
    }
  };

  // Update tempValue when value prop changes
  React.useEffect(() => {
    setTempValue(value);
  }, [value]);

  if (isEditing) {
    return (
      <div className="relative">
        <input
          type="text"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full pl-2 pr-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          autoFocus
        />
      </div>
    );
  }

  return (
    <div 
      className="group relative cursor-pointer hover:bg-blue-50 rounded px-2 py-1"
      onClick={() => setIsEditing(true)}
    >
      <span className={className}>{value}</span>
      <Edit2 className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

// DetailRenderer component for clean data presentation with better text wrapping
const DetailRenderer = ({ 
  details, 
  isEditable = false,
  onUpdate,
  editKey = ''
}: { 
  details: BenefitDetail;
  isEditable?: boolean;
  onUpdate?: (value: string) => void;
  editKey?: string;
}) => {
  if (!details || typeof details !== 'object') {
    const stringValue = details === null || details === undefined || details === '' 
      ? '-' 
      : String(details);
    
    if (isEditable && onUpdate) {
      return <EditableTableCell value={stringValue} onUpdate={onUpdate} className="text-sm" />;
    }
    
    return <p className="text-sm break-words whitespace-normal leading-relaxed">{stringValue}</p>;
  }
  return (
    <ul className="space-y-2">
      {Object.entries(details).map(([key, value]) => (
        <li key={key} className="text-sm">
          <span className="font-semibold text-foreground capitalize break-words">
            {key.replace(/([A-Z])/g, ' $1')}:
          </span>
          <span className="ml-2 text-muted-foreground break-words">
            {typeof value === 'object' && value !== null ? (
              <DetailRenderer 
                details={value} 
                isEditable={isEditable}
                onUpdate={onUpdate}
                editKey={`${editKey}-${key}`}
              />
            ) : (
              value === null || value === undefined || value === '' ? '-' : String(value)
            )}
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
        
        // Extract ALL fields from coverage object, including nested benefitDetails
        const { benefitDetails, ...coverageFields } = coverage;
        
        // Flatten benefitDetails if it exists
        let flattenedBenefitDetails: Record<string, any> = {};
        if (benefitDetails && typeof benefitDetails === 'object') {
          // Handle nested objects in benefitDetails
          Object.entries(benefitDetails).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              // For nested objects, prefix with parent key
              Object.entries(value).forEach(([subKey, subValue]) => {
                flattenedBenefitDetails[`${key}_${subKey}`] = subValue;
              });
            } else {
              // Handle backward compatibility: rename 'formula' to 'benefitAmount'
              const normalizedKey = key === 'formula' ? 'benefitAmount' : key;
              flattenedBenefitDetails[normalizedKey] = value;
            }
          });
        }
        
        benefitData[key] = {
          carrierName: coverage.carrierName || carrierName,
          planOptionName: coverage.planOptionName || 'Default',
          coverageType: coverage.coverageType,
          ...coverageFields,  // Include ALL coverage fields
          ...flattenedBenefitDetails  // Include ALL flattened benefit details
        };
      }
    }
    // Check for new format data directly in allCoverages (at root level)
    else if ((doc as any).allCoverages) {
      const coverages = (doc as any).allCoverages;
      
      for (const coverage of coverages) {
        if (!coverage.coverageType) continue;
        
        const key = `${carrierName}-${coverage.planOptionName || 'Default'}-${coverage.coverageType}`;
        
        // Extract ALL fields from coverage object, including nested benefitDetails
        const { benefitDetails, ...coverageFields } = coverage;
        
        // Flatten benefitDetails if it exists
        let flattenedBenefitDetails: Record<string, any> = {};
        if (benefitDetails && typeof benefitDetails === 'object') {
          // Handle nested objects in benefitDetails
          Object.entries(benefitDetails).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              // For nested objects, prefix with parent key
              Object.entries(value).forEach(([subKey, subValue]) => {
                flattenedBenefitDetails[`${key}_${subKey}`] = subValue;
              });
            } else {
              // Handle backward compatibility: rename 'formula' to 'benefitAmount'
              const normalizedKey = key === 'formula' ? 'benefitAmount' : key;
              flattenedBenefitDetails[normalizedKey] = value;
            }
          });
        }
        
        benefitData[key] = {
          carrierName: coverage.carrierName || carrierName,
          planOptionName: coverage.planOptionName || 'Default',
          coverageType: coverage.coverageType,
          ...coverageFields,  // Include ALL coverage fields
          ...flattenedBenefitDetails  // Include ALL flattened benefit details
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
    'premium': 'Premium',
    'unitRate': 'Unit Rate',
    'unitRateBasis': 'Rate Basis',
    'volume': 'Volume',
    'lives': 'Lives',
    'livesSingle': 'Single Lives',
    'livesFamily': 'Family Lives',
    'premiumPerSingle': 'Premium Per Single',
    'premiumPerFamily': 'Premium Per Family',
    'benefitAmount': 'Benefit Amount',
    'nonEvidenceMaximum': 'Non-Evidence Maximum',
    'nonEvidenceMax': 'Non-Evidence Max',
    'reductionFormula': 'Reduction Formula',
    'benefitReductionSchedule': 'Benefit Reduction Schedule',
    'terminationAge': 'Termination Age',
    'spouseBenefitAmount': 'Spouse Benefit Amount',
    'childBenefitAmount': 'Child Benefit Amount',
    'spouseAmount': 'Spouse Amount',
    'childAmount': 'Child Amount',
    'deductible': 'Deductible',
    'coinsurance': 'Coinsurance',
    'lifetimeMaximum': 'Lifetime Maximum',
    'drugPlan': 'Drug Plan',
    'drugCard': 'Drug Card',
    'drugCoinsurance': 'Drug Coinsurance',
    'drugMaximum': 'Drug Maximum',
    'paramedicalCoverage': 'Paramedical Coverage',
    'paramedicalMaximum': 'Paramedical Maximum',
    'paramedicalCoinsurance': 'Paramedical Coinsurance',
    'hospital': 'Hospital Coverage',
    'hospitalCoverage': 'Hospital Coverage',
    'annualMaximum': 'Annual Maximum',
    'overallMaximum': 'Overall Maximum',
    'feeGuide': 'Fee Guide',
    'recallFrequency': 'Recall Frequency',
    'basicCoinsurance': 'Basic Coinsurance',
    'basicMaximum': 'Basic Maximum',
    'majorCoinsurance': 'Major Coinsurance',
    'orthoCoinsurance': 'Ortho Coinsurance',
    'visionMaximum': 'Vision Maximum',
    'visionCoinsurance': 'Vision Coinsurance',
    'travelCoverage': 'Travel Coverage',
    'survivorBenefit': 'Survivor Benefit',
    'poolingThreshold': 'Pooling Threshold',
    'benefitAmount': 'Benefit Amount',
    'rateGuarantees': 'Rate Guarantees'
  };
  
  // Handle nested fields with underscores (e.g., drug_coinsurance)
  if (fieldName.includes('_')) {
    const parts = fieldName.split('_');
    return parts.map(part => 
      fieldMappings[part] || part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' - ');
  }
  
  return fieldMappings[fieldName] || fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

// Sortable table row component
const SortableRow: React.FC<{
  id: string;
  field: string;
  carriers: any[];
  selectedPlanOptions: Record<string, string>;
  getBenefitDataForCarrierPlan: (carrierName: string, planOption: string, coverageType: string) => any;
  coverageType: string;
  getEditedValue: (key: string, defaultValue: any) => any;
  updateEditedValue: (key: string, value: any) => void;
  onFieldNameEdit: (field: string) => void;
  editingFieldName: string | null;
  tempFieldName: string;
  setTempFieldName: (name: string) => void;
  onFieldNameSave: () => void;
  onFieldNameCancel: () => void;
  getFieldDisplayName: (field: string) => string;
  onDelete: (field: string) => void;
}> = ({
  id,
  field,
  carriers,
  selectedPlanOptions,
  getBenefitDataForCarrierPlan,
  coverageType,
  getEditedValue,
  updateEditedValue,
  onFieldNameEdit,
  editingFieldName,
  tempFieldName,
  setTempFieldName,
  onFieldNameSave,
  onFieldNameCancel,
  getFieldDisplayName,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`group ${isDragging ? 'opacity-50' : ''}`}
    >
      <TableCell className="sticky left-0 bg-background z-10 border-r font-medium">
        <div className="flex items-center space-x-2">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          
          {/* Field name - editable */}
          {editingFieldName === field ? (
            <div className="flex items-center space-x-2 flex-1">
              <Input
                value={tempFieldName}
                onChange={(e) => setTempFieldName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onFieldNameSave();
                  if (e.key === 'Escape') onFieldNameCancel();
                }}
                className="h-8 text-sm"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={onFieldNameSave}
                className="h-8 w-8 p-0"
              >
                ✓
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onFieldNameCancel}
                className="h-8 w-8 p-0"
              >
                ✗
              </Button>
            </div>
          ) : (
            <div
              className="text-sm break-words whitespace-normal leading-relaxed flex-1 cursor-pointer hover:bg-gray-100 rounded px-2 py-1"
              onClick={() => onFieldNameEdit(field)}
            >
              {getFieldDisplayName(field)}
            </div>
          )}
          
          {/* Delete button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(field)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
      
      {carriers.map((carrier, index) => {
        const planOption = selectedPlanOptions[carrier.name] || carrier.planOptions[0] || 'Default';
        const data = getBenefitDataForCarrierPlan(carrier.name, planOption, coverageType);
        const fieldValue = data[field];
        
        const editKey = `${coverageType}-${field}-${carrier.name}-${planOption}`;
        const editedFieldValue = getEditedValue(editKey, fieldValue);
        
        // Check if this is a premium/cost field for special formatting
        const isPremiumField = ['monthlyPremium', 'premium', 'premiumPerSingle', 'premiumPerFamily'].includes(field);
        const isPercentageField = field.toLowerCase().includes('coinsurance') || field === 'coinsurance';
        
        // Format the value for display
        let displayValue = editedFieldValue;
        if (isPremiumField && typeof editedFieldValue === 'number') {
          displayValue = `$${editedFieldValue.toFixed(2)}`;
        } else if (isPercentageField && typeof editedFieldValue === 'string' && !editedFieldValue.includes('%')) {
          displayValue = `${editedFieldValue}%`;
        } else if (editedFieldValue === true) {
          displayValue = '✓ Yes';
        } else if (editedFieldValue === false) {
          displayValue = '✗ No';
        }
        
        // Determine if this value is notably different (for highlighting)
        const allValues = carriers.map(c => {
          const opt = selectedPlanOptions[c.name] || c.planOptions[0] || 'Default';
          return getBenefitDataForCarrierPlan(c.name, opt, coverageType)[field];
        }).filter(v => v !== null && v !== undefined && v !== '');
        
        const hasVariance = allValues.length > 1 && !allValues.every(v => v === allValues[0]);
        
        return (
          <TableCell key={index} className={`align-top p-4 min-w-[250px] max-w-[350px] overflow-hidden transition-colors duration-200 ${index % 2 === 1 ? 'bg-slate-100 hover:bg-sky-50/50' : 'hover:bg-sky-50/50'}`}>
            <div className={`break-words whitespace-normal ${hasVariance ? 'font-medium' : ''} ${isPremiumField ? 'text-green-700' : ''}`}>
              <DetailRenderer 
                details={displayValue}
                isEditable={true}
                onUpdate={(value) => updateEditedValue(editKey, value)}
                editKey={editKey}
              />
            </div>
          </TableCell>
        );
      })}
    </TableRow>
  );
};

const PlanComparisonTab: FC<PlanComparisonTabProps> = ({ results = [] }) => {
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlanOptions, setSelectedPlanOptions] = useState<Record<string, string>>({});
  
  // State for edited cell values
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  
  // Get all unique benefit fields across all data
  const allBenefitFields = getAllBenefitFields(extractFlexibleBenefitData(results));
  
  // History state management for table modifications
  const {
    state: tableState,
    setState: setTableState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistoryState<TableState>({
    fieldOrder: allBenefitFields,
    hiddenFields: new Set<string>(),
    customFieldNames: {},
  });
  
  // State for editing field names
  const [editingFieldName, setEditingFieldName] = useState<string | null>(null);
  const [tempFieldName, setTempFieldName] = useState<string>('');
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Helper function to get edited value or default
  const getEditedValue = (key: string, defaultValue: any) => {
    return editedValues[key] !== undefined ? editedValues[key] : defaultValue;
  };
  
  // Helper function to update edited value
  const updateEditedValue = (key: string, value: any) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
  };
  
  // Initialize field order if not set
  useEffect(() => {
    if (tableState.fieldOrder.length === 0 && allBenefitFields.length > 0) {
      setTableState(prev => ({
        ...prev,
        fieldOrder: allBenefitFields
      }));
    }
  }, [allBenefitFields]);
  
  // Handle drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setTableState(prev => {
        const oldIndex = prev.fieldOrder.indexOf(active.id);
        const newIndex = prev.fieldOrder.indexOf(over.id);
        return {
          ...prev,
          fieldOrder: arrayMove(prev.fieldOrder, oldIndex, newIndex)
        };
      });
    }
  };
  
  // Handle field name editing
  const handleFieldNameEdit = (field: string) => {
    setEditingFieldName(field);
    setTempFieldName(tableState.customFieldNames[field] || formatFieldName(field));
  };
  
  const handleFieldNameSave = () => {
    if (editingFieldName && tempFieldName.trim()) {
      setTableState(prev => ({
        ...prev,
        customFieldNames: {
          ...prev.customFieldNames,
          [editingFieldName]: tempFieldName.trim()
        }
      }));
    }
    setEditingFieldName(null);
    setTempFieldName('');
  };
  
  const handleFieldNameCancel = () => {
    setEditingFieldName(null);
    setTempFieldName('');
  };
  
  // Get display name for field
  const getFieldDisplayName = (field: string) => {
    return tableState.customFieldNames[field] || formatFieldName(field);
  };
  
  // Delete field handler
  const handleDeleteField = (field: string) => {
    setTableState(prev => ({
      ...prev,
      hiddenFields: new Set([...prev.hiddenFields, field])
    }));
  };
  
  // Show all hidden fields
  const handleShowAllFields = () => {
    setTableState(prev => ({
      ...prev,
      hiddenFields: new Set()
    }));
  };
  
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
  
  // Get ordered fields (use custom order or default)
  const orderedFields = tableState.fieldOrder.length > 0 ? tableState.fieldOrder : allBenefitFields;

  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex justify-between items-center">
          <CardTitle>Plan Comparison</CardTitle>
          <div className="flex items-center gap-2">
            {/* Undo/Redo buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={!canUndo}
                className="h-8 w-8 p-0"
                title="Undo"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={!canRedo}
                className="h-8 w-8 p-0"
                title="Redo"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
            
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
            
            {/* Benefit Comparison Table */}
            <div className="overflow-x-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
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
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <SortableContext
                    items={orderedFields}
                    strategy={verticalListSortingStrategy}
                  >
                    <TableBody>
                      {orderedFields
                        .filter(field => !tableState.hiddenFields.has(field))
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
                          if (getFieldDisplayName(field).toLowerCase().includes(query)) return true;
                          
                          // Check field values
                          return carriers.some(carrier => {
                            const planOption = selectedPlanOptions[carrier.name] || carrier.planOptions[0] || 'Default';
                            const data = getBenefitDataForCarrierPlan(carrier.name, planOption, coverageType);
                            const value = data[field];
                            return value && String(value).toLowerCase().includes(query);
                          });
                        })
                        .map((field) => (
                          <SortableRow
                            key={field}
                            id={field}
                            field={field}
                            carriers={carriers}
                            selectedPlanOptions={selectedPlanOptions}
                            getBenefitDataForCarrierPlan={getBenefitDataForCarrierPlan}
                            coverageType={coverageType}
                            getEditedValue={getEditedValue}
                            updateEditedValue={updateEditedValue}
                            onFieldNameEdit={handleFieldNameEdit}
                            editingFieldName={editingFieldName}
                            tempFieldName={tempFieldName}
                            setTempFieldName={setTempFieldName}
                            onFieldNameSave={handleFieldNameSave}
                            onFieldNameCancel={handleFieldNameCancel}
                            getFieldDisplayName={getFieldDisplayName}
                            onDelete={handleDeleteField}
                          />
                        ))}
                    </TableBody>
                  </SortableContext>
                </Table>
              </DndContext>
            </div>
          </div>
        ))}
        
        {/* Hidden fields indicator and restore */}
        {tableState.hiddenFields.size > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {tableState.hiddenFields.size} row{tableState.hiddenFields.size === 1 ? '' : 's'} hidden
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowAllFields}
                className="text-sm"
              >
                Show all hidden rows
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlanComparisonTab;