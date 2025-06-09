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
          <span className="ml-2 text-muted-foreground break-words whitespace-normal leading-relaxed">
            {String(value)}
          </span>
        </li>
      ))}
    </ul>
  );
};

// Helper function to extract benefit information from coverage data
const extractBenefitData = (coverages: Coverage[], benefitField: string): Record<string, Record<string, BenefitDetail>> => {
  const benefitData: Record<string, Record<string, BenefitDetail>> = {};
  
  if (!Array.isArray(coverages)) return benefitData;
  
  for (const coverage of coverages) {
    if (coverage.coverageType && coverage.benefitDetails) {
      const coverageType = coverage.coverageType;
      
      if (!benefitData[coverageType]) {
        benefitData[coverageType] = {};
      }
      
      // Map benefit details to the appropriate field
      if (coverage.benefitDetails) {
        for (const [key, value] of Object.entries(coverage.benefitDetails)) {
          // Type assert value as BenefitDetail since we've defined our structure to match this format
          benefitData[coverageType][key] = value as BenefitDetail;
        }
      }
    }
  }
  
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

const PlanComparisonTab: FC<PlanComparisonTabProps> = ({ results = [] }) => {
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Default expanded accordion items
  const [expandedItems, setExpandedItems] = useState<string[]>([
    'LIFE INSURANCE & AD&D',
    'DEPENDENT LIFE', 
    'LONG TERM DISABILITY',
    'EXTENDED HEALTHCARE',
    'DENTAL CARE'
  ]);

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
  const filterBySearch = (category: { name: string }) => {
    if (!searchQuery) {
      return true;
    }
    
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
              onClick={() => setExpandedItems(expandedItems.length === benefitCategories.length ? [] : benefitCategories.map(cat => cat.name))}
            >
              {expandedItems.length === benefitCategories.length ? (
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
      <CardContent className="p-4">
        <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems}>
          {benefitCategories
            .filter(filterBySearch)
            .map((category) => (
              <AccordionItem key={category.name} value={category.name}>
                <AccordionTrigger className="hover:no-underline text-base font-semibold hover:bg-muted/50 rounded-md px-4">
                  <span className="font-semibold text-left">{category.name}</span>
                </AccordionTrigger>
                <AccordionContent className="p-2">
                  <div className="overflow-x-auto">
                    <Table className="table-auto w-full [&_tr:nth-child(even)]:bg-muted/30">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky left-0 bg-background z-10 border-r border-b-2 border-b-teal-500">
                            <div className="font-semibold">Benefit</div>
                          </TableHead>
                          {carriers.map((carrier, index) => (
                            <TableHead key={carrier.id} className={`min-w-[250px] max-w-[350px] border-b-2 border-b-teal-500 ${index % 2 === 1 ? 'bg-slate-100/50' : ''}`}>
                              <div className="flex flex-col items-center justify-center gap-1.5 p-2">
                                <div className="font-semibold text-sm text-center text-teal-600">{carrier.name}</div>
                                <Badge variant="secondary">{results[index]?.metadata?.planOptions?.[0]?.planOptionName || 'Details'}</Badge>
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {category.fields.map((field) => (
                          <TableRow key={field.id}>
                            <TableCell className="font-medium sticky left-0 bg-background z-10 border-r w-[330px] min-w-[330px] p-4">
                              <div className="text-sm break-words whitespace-normal leading-relaxed">
                                {field.label}
                              </div>
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
                                <TableCell key={index} className={`align-top p-4 min-w-[250px] max-w-[350px] overflow-hidden ${index % 2 === 1 ? 'bg-slate-100/50' : ''}`}>
                                  <div className="break-words whitespace-normal">
                                    <DetailRenderer 
                                      details={fieldValue === true ? 'Yes' :
                                             fieldValue === false ? 'No' :
                                             fieldValue === 0 ? '0' :
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
                </AccordionContent>
              </AccordionItem>
            ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default PlanComparisonTab;
