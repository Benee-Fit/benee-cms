import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';
import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import { Textarea } from '@repo/design-system/components/ui/textarea';
import CoverageSidebar from './CoverageSidebar';
import PremiumComparisonTable from './PremiumComparisonTable';
import PlanComparisonTab from './PlanComparisonTab';
import { Pencil, Save, X } from 'lucide-react';

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

interface MarketComparisonViewProps {
  parsedDocuments: ParsedDocument[];
  coverageTypesList: string[];
  carriersMap: Record<string, string[]>;
}

const MarketComparisonView: React.FC<MarketComparisonViewProps> = ({
  parsedDocuments,
  // Use coverageTypesList for future features if needed
  carriersMap
}) => {
  // Predefined mapping between coverage categories and their associated keywords
  const coverageCategoriesMap: Record<string, string[]> = {
    'Insurance': ['Basic Life', 'AD&D', 'Dependent Life', 'Critical Illness', 'Long Term Disability', 'Short Term Disability'],
    'Healthcare': ['Extended Healthcare', 'Health Care (EHC)', 'Dental Care', 'Vision'],
    'Additional Benefits': ['EAP', 'HSA', 'Health Spending Account', 'Wellness']
  };

  // State
  const [activeCoverage, setActiveCoverage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('premium');
  const [coverageNotes, setCoverageNotes] = useState<Record<string, string>>({});
  const [editingNoteFor, setEditingNoteFor] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');
  
  // Extract all coverage types and ensure they are strings
  const rawCoverageTypes = parsedDocuments
    .flatMap(doc => {
      if (!doc.coverages || !Array.isArray(doc.coverages)) {
        return [];
      }
      return doc.coverages
        .map(coverage => {
          if (!coverage || typeof coverage !== 'object') {
            return '';
          }
          const coverageType = coverage.coverageType;
          return typeof coverageType === 'string' ? coverageType : '';
        })
        .filter(type => type !== '');
    });
  
  // Create a Set of unique coverage types
  const allCoverageTypes: string[] = Array.from(new Set(rawCoverageTypes));
  
  // Define a simpler mapping function
  const getCategoryForType = (type: string): string => {
    const lowerType = type.toLowerCase();
    
    // Insurance categories
    if (
      lowerType.includes('life') || 
      lowerType.includes('ad&d') || 
      lowerType.includes('disability') || 
      lowerType.includes('critical illness')
    ) {
      return 'Insurance';
    }
    
    // Healthcare categories
    if (
      lowerType.includes('health') || 
      lowerType.includes('dental') || 
      lowerType.includes('vision')
    ) {
      return 'Healthcare';
    }
    
    // Additional Benefits
    if (
      lowerType.includes('eap') || 
      lowerType.includes('hsa') || 
      lowerType.includes('wellness')
    ) {
      return 'Additional Benefits';
    }
    
    // Default category
    return 'Other';
  };
  
  // Initialize the organized types with empty arrays
  const organizedCoverageTypes: Record<string, string[]> = {
    'Insurance': [],
    'Healthcare': [],
    'Additional Benefits': [],
    'Other': []
  };
  
  // Categorize each coverage type
  for (const type of allCoverageTypes) {
    if (typeof type === 'string') {
      const category = getCategoryForType(type);
      organizedCoverageTypes[category].push(type);
    }
  }
  
  // Debugging: Find any non-string values in the organizedCoverageTypes
  for (const [category, types] of Object.entries(organizedCoverageTypes)) {
    if (!Array.isArray(types)) {
      // This would be a direct object rendering problem - log but don't render
      // Logging commented out in production, uncomment for debugging
      // console.warn(`Category ${category} has a non-array value:`, types);
      organizedCoverageTypes[category] = [];
    } else {
      // Filter out any non-string values to prevent rendering objects
      organizedCoverageTypes[category] = types.filter(type => typeof type === 'string');
      
      // Count non-string values (only in development)
      // const nonStringCount = types.filter(type => typeof type !== 'string').length;
      // if (nonStringCount > 0) {
      //   console.warn(`Category ${category} had ${nonStringCount} non-string values that were filtered`);
      // }
    }
  }
  
  // Handle coverage type selection
  const handleCoverageSelect = (coverageType: string) => {
    setActiveCoverage(coverageType === activeCoverage ? null : coverageType);
  };
  
  // Note editing functions
  const startEditingNote = (coverageType: string) => {
    setEditingNoteFor(coverageType);
    setNoteContent(coverageNotes[coverageType] || '');
  };
  
  const saveNote = () => {
    if (editingNoteFor) {
      setCoverageNotes({
        ...coverageNotes,
        [editingNoteFor]: noteContent
      });
      setEditingNoteFor(null);
      setNoteContent('');
    }
  };
  
  const cancelEditingNote = () => {
    setEditingNoteFor(null);
    setNoteContent('');
  };
  
  // Filter documents by active coverage if one is selected
  const filteredDocuments = parsedDocuments
    .map(doc => {
      // Debug: Check if any coverage objects might have unexpected structure
      if (doc.coverages) {
        // Use for-of loop instead of traditional for loop
        for (const [idx, coverage] of doc.coverages.entries()) {
          if (!coverage || typeof coverage !== 'object') {
            continue;
          }
          
          if (typeof coverage.coverageType !== 'string' && coverage.coverageType !== undefined) {
            // Fix the invalid coverageType by converting to string or setting to a default
            if (coverage.coverageType) {
              try {
                doc.coverages[idx].coverageType = String(coverage.coverageType);
              } catch {
                doc.coverages[idx].coverageType = 'Unknown';
              }
            } else {
              doc.coverages[idx].coverageType = 'Unknown';
            }
          }
        }
      }
      
      // Ensure relevantCoverages only contains coverages with string coverageType
      return {
        ...doc,
        relevantCoverages: doc.coverages?.filter(
          coverage => {
            if (!activeCoverage) {
              return true;
            }
            return typeof coverage.coverageType === 'string' && coverage.coverageType === activeCoverage;
          }
        )
      };
    })
    .filter(doc => !activeCoverage || (doc.relevantCoverages && doc.relevantCoverages.length > 0));
  // Only include documents that have coverages after filtering
  // This step is redundant as we're already checking for relevantCoverages.length > 0 above
  const documentsWithCoverages = filteredDocuments;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-4">
      {/* Sidebar */}
      <div className="md:block">
        <CoverageSidebar 
          coverageCategories={(() => {
            // Create a sanitized version with strict type checking
            const sanitized = Object.entries(organizedCoverageTypes).reduce((acc, [category, types]) => {
              // Final safety check to ensure we only pass string arrays
              if (Array.isArray(types)) {
                acc[category] = types.filter(type => typeof type === 'string');
              } else {
                // Replace console.warn with silent handling
                // console.warn(`Found non-array for category ${category}:`, types);
                acc[category] = [];
              }
              return acc;
            }, {} as Record<string, string[]>);
            
            // Verify the final object has no unexpected types and fix them if needed
            for (const [category, types] of Object.entries(sanitized)) {
              if (!Array.isArray(types)) {
                // Replace console.error with direct fix
                sanitized[category] = [];
              }
            }
            
            return sanitized;
          })()}
          activeCoverage={activeCoverage}
          onCoverageSelect={handleCoverageSelect}
        />
      </div>
      
      {/* Main Content */}
      <div className="space-y-4">
        {/* Active coverage header & notes */}
        {activeCoverage && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">{activeCoverage}</h3>
                {editingNoteFor !== activeCoverage ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditingNote(activeCoverage)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    {coverageNotes[activeCoverage] ? 'Edit Note' : 'Add Note'}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="default" size="sm" onClick={saveNote}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={cancelEditingNote}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {editingNoteFor === activeCoverage ? (
                <Textarea
                  placeholder="Add notes about this coverage..."
                  className="w-full"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
              ) : (
                coverageNotes[activeCoverage] && (
                  <div className="bg-muted/30 p-3 rounded-md text-sm">
                    {coverageNotes[activeCoverage]}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Tabs for Premium and Plan comparison */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="premium">Premium Comparison</TabsTrigger>
            <TabsTrigger value="plan">Plan Comparison</TabsTrigger>
          </TabsList>
          
          <TabsContent value="premium" className="mt-0">
            <PremiumComparisonTable results={documentsWithCoverages} />
          </TabsContent>
          
          <TabsContent value="plan" className="mt-0">
            <PlanComparisonTab results={documentsWithCoverages} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MarketComparisonView;
