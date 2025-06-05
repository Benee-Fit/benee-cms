import React, { useState, useEffect, useRef } from 'react';
import type { ParsedDocument } from '../../../types';
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
import { Button } from '@repo/design-system/components/ui/button';
import { Badge } from '@repo/design-system/components/ui/badge';
import { ChevronRight, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { Input } from '@repo/design-system/components/ui/input';

// Using shared ParsedDocument type from types.ts

interface PlanComparisonTabProps {
  results: ParsedDocument[];
}

// Helper function to extract benefit information from coverage data
const extractBenefitData = (coverages: any[], benefitField: string): Record<string, any> => {
  const benefitData: Record<string, any> = {};
  
  if (!Array.isArray(coverages)) return benefitData;
  
  coverages.forEach(coverage => {
    if (coverage.coverageType && coverage.benefitDetails) {
      const coverageType = coverage.coverageType;
      
      if (!benefitData[coverageType]) {
        benefitData[coverageType] = {};
      }
      
      // Map benefit details to the appropriate field
      Object.entries(coverage.benefitDetails).forEach(([key, value]) => {
        benefitData[coverageType][key] = value;
      });
    }
  });
  
  return benefitData;
};

// Define benefit categories and their fields
const benefitCategories = [
  {
    name: 'LIFE INSURANCE & AD&D',
    fields: [
      { id: 'schedule', label: 'Schedule' },
      { id: 'benefitAmount', label: 'Benefit Amount' },
      { id: 'reduction', label: 'Age Reduction Schedule' },
      { id: 'nonEvidenceMaximum', label: 'Non-Evidence Maximum' },
      { id: 'overallMaximum', label: 'Overall Maximum' },
      { id: 'terminationAge', label: 'Termination Age' },
      { id: 'waiver', label: 'Waiver of Premium' },
      { id: 'conversion', label: 'Conversion' }
    ]
  },
  {
    name: 'DEPENDENT LIFE',
    fields: [
      { id: 'spouse', label: 'Spouse' },
      { id: 'child', label: 'Child' },
      { id: 'terminationAge', label: 'Termination Age' }
    ]
  },
  {
    name: 'LONG TERM DISABILITY',
    fields: [
      { id: 'schedule', label: 'Schedule' },
      { id: 'monthlyMaximum', label: 'Monthly Maximum' },
      { id: 'taxStatus', label: 'Tax Status' },
      { id: 'eliminationPeriod', label: 'Elimination Period' },
      { id: 'benefitPeriod', label: 'Benefit Period' },
      { id: 'ownOccupationPeriod', label: 'Own Occupation Period' },
      { id: 'definition', label: 'Definition of Disability' },
      { id: 'offsets', label: 'Offsets' },
      { id: 'costOfLivingAdjustment', label: 'Cost of Living Adjustment' },
      { id: 'preExisting', label: 'Pre-Existing Condition' },
      { id: 'survivorBenefit', label: 'Survivor Benefit' },
      { id: 'terminationAge', label: 'Termination Age' }
    ]
  },
  {
    name: 'EXTENDED HEALTHCARE',
    fields: [
      { id: 'deductible', label: 'Deductible' },
      { id: 'coinsurance', label: 'Coinsurance' },
      { id: 'hospitalCoverage', label: 'Hospital Coverage' },
      { id: 'prescriptionDrugs', label: 'Prescription Drugs' },
      { id: 'drugCard', label: 'Drug Card' },
      { id: 'dispensingFee', label: 'Dispensing Fee' },
      { id: 'paramedicalPractitioners', label: 'Paramedical Practitioners' },
      { id: 'visionCare', label: 'Vision Care' },
      { id: 'hearingAids', label: 'Hearing Aids' },
      { id: 'medicalEquipment', label: 'Medical Equipment' },
      { id: 'privateNursing', label: 'Private Nursing' },
      { id: 'ambulance', label: 'Ambulance' },
      { id: 'travelInsurance', label: 'Travel Insurance' },
      { id: 'maximums', label: 'Maximums' },
      { id: 'terminationAge', label: 'Termination Age' }
    ]
  },
  {
    name: 'DENTAL CARE',
    fields: [
      { id: 'deductible', label: 'Deductible' },
      { id: 'basicServices', label: 'Basic Services' },
      { id: 'majorServices', label: 'Major Services' },
      { id: 'orthodontics', label: 'Orthodontics' },
      { id: 'recallExam', label: 'Recall Exam' },
      { id: 'feeGuide', label: 'Fee Guide' },
      { id: 'maximums', label: 'Maximums' },
      { id: 'terminationAge', label: 'Termination Age' }
    ]
  }
];

const PlanComparisonTab: React.FC<PlanComparisonTabProps> = ({ results = [] }) => {
  // State for expanded/collapsed categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'LIFE INSURANCE & AD&D': true,
    'DEPENDENT LIFE': true,
    'LONG TERM DISABILITY': true,
    'EXTENDED HEALTHCARE': true,
    'DENTAL CARE': true
  });

  // State for tracking if all categories are expanded
  const [allExpanded, setAllExpanded] = useState<boolean>(true);
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newState = {
        ...prev,
        [category]: !prev[category]
      };
      // Check if all are expanded after this update
      const areAllExpanded = Object.values(newState).every(value => value === true);
      setAllExpanded(areAllExpanded);
      return newState;
    });
  };

  // Toggle all categories
  const toggleAllCategories = (expand: boolean) => {
    const updatedState: Record<string, boolean> = {};
    Object.keys(expandedCategories).forEach(category => {
      updatedState[category] = expand;
    });
    setExpandedCategories(updatedState);
    setAllExpanded(expand);
  };
  
  // Check if all categories are expanded initially
  useEffect(() => {
    const areAllExpanded = Object.values(expandedCategories).every(value => value === true);
    if (areAllExpanded !== allExpanded) {
      setAllExpanded(areAllExpanded);
    }
  }, []);

  // Clean up carrier name
  const getProperCarrierName = (result: ParsedDocument): string => {
    return result.metadata?.carrierName || 
           result.coverages?.[0]?.carrierName || 
           'Unknown Carrier';
  };

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No data available for plan comparison.</p>
      </div>
    );
  }

  // Extract carrier names
  const carriers = results.map(result => {
    const carrierName = getProperCarrierName(result);
    
    return {
      id: Math.random().toString(36).substring(2, 9),
      name: carrierName
    };
  });

  // Extract benefit data from coverages
  const benefitData = results.map(result => {
    return extractBenefitData(result.coverages, 'benefitDetails');
  });

  // Search filter function
  const filterBySearch = (category: any) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Check if category name matches
    if (category.name.toLowerCase().includes(query)) return true;
    
    // Check if any field label matches
    const hasMatchingField = category.fields.some((field: any) => 
      field.label.toLowerCase().includes(query)
    );
    
    if (hasMatchingField) return true;
    
    // Check if any benefit data matches
    const hasMatchingData = category.fields.some((field: any) => {
      return benefitData.some((data) => {
        const categoryData = Object.values(data).flat();
        return categoryData.some((item: any) => 
          item && typeof item === 'object' && 
          field.id in item && 
          String(item[field.id]).toLowerCase().includes(query)
        );
      });
    });
    
    return hasMatchingData;
  };

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAllCategories(!allExpanded)}
            >
              {allExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Collapse All
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Expand All
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-muted/50">
                <TableHead className="w-[200px]">Benefit</TableHead>
                {carriers.map((carrier, index) => (
                  <TableHead key={carrier.id} className="min-w-[180px]">
                    <div className="flex flex-col">
                      <span className="font-semibold">{carrier.name}</span>
                      <Badge variant="outline" className="mt-1 w-fit">
                        {results[index]?.category || 'Current'}
                      </Badge>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {benefitCategories
                .filter(filterBySearch)
                .map((category) => (
                  <React.Fragment key={category.name}>
                    {/* Category header row */}
                    <TableRow 
                      className="bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleCategory(category.name)}
                    >
                      <TableCell colSpan={carriers.length + 1} className="font-semibold">
                        <div className="flex items-center">
                          {expandedCategories[category.name] ? (
                            <ChevronDown className="h-4 w-4 mr-2 transition-transform" />
                          ) : (
                            <ChevronRight className="h-4 w-4 mr-2 transition-transform" />
                          )}
                          {category.name}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Category content rows, only shown when expanded */}
                    {expandedCategories[category.name] && category.fields.map((field) => (
                      <TableRow key={field.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="pl-8 font-medium text-sm">
                          {field.label}
                        </TableCell>
                        {benefitData.map((data, index) => {
                          // Find the corresponding coverage type in the data
                          const coverageType = Object.keys(data).find(key => 
                            key.toUpperCase().includes(category.name.split(' ')[0]) ||
                            category.name.includes(key.toUpperCase())
                          );
                          
                          // Get the field value if it exists
                          const fieldValue = coverageType && data[coverageType] ? 
                            data[coverageType][field.id] : null;

                          return (
                            <TableCell key={index} className="text-sm">
                              {fieldValue === true ? 'Yes' :
                               fieldValue === false ? 'No' :
                               fieldValue === 0 ? '0' :
                               fieldValue || '-'}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanComparisonTab;
