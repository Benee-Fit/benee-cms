'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/header';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@repo/design-system/components/ui/alert';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@repo/design-system/components/ui/select';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { Badge } from '@repo/design-system/components/ui/badge';
import { 
  FileText, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  Info,
  DollarSign,
  Users,
  Shield,
  Plus,
  CheckCircle
} from 'lucide-react';

interface DetectedPlan {
  planOptionName: string;
  totalMonthlyPremium: number;
  coverageTypes: string[];
  rateGuarantee?: string;
}

interface DocumentWithPlans {
  documentId: string;
  fileName: string;
  carrierName: string;
  detectedPlans: DetectedPlan[];
  processedData: any;
  selectedPlans: string[];
  planQuoteTypes: Record<string, string>; // planName -> quoteType mapping
  planHSAOptions: Record<string, boolean>; // planName -> includesHSA mapping
  planHSADetails: Record<string, { overageAmount: number; wellnessCoverage: number }>; // planName -> HSA details
}


// Quote Type Selector Component
interface QuoteTypeSelectorProps {
  documentId: string;
  planName: string;
  currentQuoteType: string;
  availableTypes: string[];
  onQuoteTypeChange: (documentId: string, planName: string, quoteType: string) => void;
  onAddCustomType: (customType: string) => void;
}

function QuoteTypeSelector({ 
  documentId, 
  planName,
  currentQuoteType, 
  availableTypes, 
  onQuoteTypeChange, 
  onAddCustomType
}: QuoteTypeSelectorProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTypeInput, setCustomTypeInput] = useState('');

  const handleCustomTypeSubmit = () => {
    if (customTypeInput.trim()) {
      onAddCustomType(customTypeInput.trim());
      onQuoteTypeChange(documentId, planName, customTypeInput.trim());
      setCustomTypeInput('');
      setShowCustomInput(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomTypeSubmit();
    } else if (e.key === 'Escape') {
      setShowCustomInput(false);
      setCustomTypeInput('');
    }
  };

  return (
    <div className="space-y-2">
      <Select
        value={currentQuoteType}
        onValueChange={(value) => {
          if (value === 'custom') {
            setShowCustomInput(true);
          } else {
            onQuoteTypeChange(documentId, planName, value);
          }
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
          <SelectItem value="custom">
            <div className="flex items-center space-x-2">
              <Plus className="h-3 w-3" />
              <span>Add Custom Type</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      
      {showCustomInput && (
        <div className="flex space-x-2">
          <Input
            placeholder="Enter custom quote type"
            value={customTypeInput}
            onChange={(e) => setCustomTypeInput(e.target.value)}
            onKeyDown={handleKeyPress}
            autoFocus
          />
          <Button onClick={handleCustomTypeSubmit} size="sm">
            Add
          </Button>
          <Button 
            onClick={() => {
              setShowCustomInput(false);
              setCustomTypeInput('');
            }} 
            variant="outline" 
            size="sm"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

export default function PlanSelectionPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentWithPlans[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [customQuoteTypes, setCustomQuoteTypes] = useState<string[]>([]);

  // Load processed documents from localStorage
  useEffect(() => {
    const loadDocuments = () => {
      try {
        const parsedDocuments = localStorage.getItem('parsedBenefitsDocuments');
        
        if (!parsedDocuments) {
          setError('No processed documents found. Please go back and upload documents first.');
          setIsLoading(false);
          return;
        }

        const processedResults = JSON.parse(parsedDocuments);
        
        // Transform processed results into DocumentWithPlans format
        const documentsWithPlans: DocumentWithPlans[] = processedResults.map((result: any, index: number) => {
          const documentId = `doc-${index}-${Date.now()}`;
          const carrierName = extractCarrierName(result);
          const detectedPlans = extractPlansFromResult(result);
          
          // Initialize planQuoteTypes with default 'Current' for each plan
          const planQuoteTypes: Record<string, string> = {};
          const planHSAOptions: Record<string, boolean> = {};
          const planHSADetails: Record<string, { overageAmount: number; wellnessCoverage: number }> = {};
          detectedPlans.forEach(plan => {
            if (plan && plan.planOptionName) {
              planQuoteTypes[plan.planOptionName] = 'Current';
              planHSAOptions[plan.planOptionName] = false;
              planHSADetails[plan.planOptionName] = { overageAmount: 0, wellnessCoverage: 0 };
            }
          });

          return {
            documentId,
            fileName: result.originalFileName || `Document ${index + 1}`,
            carrierName,
            detectedPlans,
            processedData: result,
            selectedPlans: [],
            planQuoteTypes,
            planHSAOptions,
            planHSADetails
          };
        });

        setDocuments(documentsWithPlans);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load processed documents. Please try again.');
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, []);

  // Extract carrier name from processed result
  const extractCarrierName = (result: any): string => {
    if (result.processedData?.metadata?.carrierName) {
      return result.processedData.metadata.carrierName;
    }
    if (result.metadata?.carrierName) {
      return result.metadata.carrierName;
    }
    if (result.coverages?.[0]?.carrierName) {
      return result.coverages[0].carrierName;
    }
    return 'Unknown Carrier';
  };

  // Extract plans from processed result
  const extractPlansFromResult = (result: any): DetectedPlan[] => {
    // Handle new format
    if (result.processedData?.highLevelOverview) {
      return result.processedData.highLevelOverview.map((overview: any) => ({
        planOptionName: overview.planOption,
        totalMonthlyPremium: overview.totalMonthlyPremium,
        coverageTypes: extractCoverageTypesFromGranular(result.processedData.granularBreakdown, overview.planOption),
        rateGuarantee: overview.rateGuarantee
      }));
    }
    
    // Handle legacy format
    if (result.processedData?.planOptions) {
      return result.processedData.planOptions.map((plan: any) => ({
        planOptionName: plan.planOptionName,
        totalMonthlyPremium: plan.carrierProposals?.[0]?.totalMonthlyPremium || 0,
        coverageTypes: extractCoverageTypesFromCoverages(result.processedData.allCoverages, plan.planOptionName),
        rateGuarantee: plan.carrierProposals?.[0]?.rateGuaranteeText
      }));
    }

    // Fallback: create a default plan
    return [{
      planOptionName: 'Default Plan',
      totalMonthlyPremium: 0,
      coverageTypes: ['Basic Life'],
      rateGuarantee: 'Not specified'
    }];
  };

  // Extract coverage types from granular breakdown
  const extractCoverageTypesFromGranular = (granularBreakdown: any[], planOption: string): string[] => {
    if (!granularBreakdown) return [];
    
    return granularBreakdown
      .filter(breakdown => 
        breakdown.carrierData.some((carrier: any) => 
          carrier.planOption === planOption && carrier.included
        )
      )
      .map(breakdown => breakdown.benefitType);
  };

  // Extract coverage types from legacy coverages array
  const extractCoverageTypesFromCoverages = (allCoverages: any[], planOptionName: string): string[] => {
    if (!allCoverages) return [];
    
    return [...new Set(
      allCoverages
        .filter(coverage => coverage.planOptionName === planOptionName)
        .map(coverage => coverage.coverageType)
    )];
  };

  // Update quote type for a specific plan
  const updateQuoteType = (documentId: string, planName: string, quoteType: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.documentId === documentId 
        ? { 
            ...doc, 
            planQuoteTypes: {
              ...(doc.planQuoteTypes || {}),
              [planName]: quoteType
            }
          }
        : doc
    ));
  };

  // Add custom quote type
  const addCustomQuoteType = (customType: string) => {
    if (customType && !customQuoteTypes.includes(customType)) {
      setCustomQuoteTypes(prev => [...prev, customType]);
    }
  };

  // Get all available quote types
  const getAvailableQuoteTypes = () => {
    const defaultTypes = ['Current', 'Go To Market', 'Negotiated', 'Alternative'];
    return [...defaultTypes, ...customQuoteTypes];
  };

  // Update selected plans for a document
  const updateSelectedPlans = (documentId: string, selectedPlans: string[]) => {
    setDocuments(prev => prev.map(doc => 
      doc.documentId === documentId 
        ? { ...doc, selectedPlans }
        : doc
    ));
  };

  // Update HSA option for a specific plan
  const updatePlanHSAOption = (documentId: string, planName: string, includesHSA: boolean) => {
    setDocuments(prev => prev.map(doc => 
      doc.documentId === documentId 
        ? { 
            ...doc, 
            planHSAOptions: {
              ...(doc.planHSAOptions || {}),
              [planName]: includesHSA
            }
          }
        : doc
    ));
  };

  // Update HSA details for a specific plan
  const updatePlanHSADetails = (documentId: string, planName: string, field: 'overageAmount' | 'wellnessCoverage', value: number) => {
    setDocuments(prev => prev.map(doc => 
      doc.documentId === documentId 
        ? { 
            ...doc, 
            planHSADetails: {
              ...(doc.planHSADetails || {}),
              [planName]: {
                ...(doc.planHSADetails?.[planName] || { overageAmount: 0, wellnessCoverage: 0 }),
                [field]: value
              }
            }
          }
        : doc
    ));
  };

  // Remove document
  const removeDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.documentId !== documentId));
  };

  // Save selections and proceed
  const handleProceedToComparison = async () => {
    // Validate that at least one document has selected plans
    const documentsWithSelections = documents.filter(doc => doc.selectedPlans.length > 0);
    
    if (documentsWithSelections.length === 0) {
      setError('Please select at least one plan from any document to proceed.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Save plan selections to API
      const response = await fetch('/api/plan-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentSelections: documents.map(doc => ({
            documentId: doc.documentId,
            fileName: doc.fileName,
            carrierName: doc.carrierName,
            planQuoteTypes: doc.planQuoteTypes || {},
            planHSAOptions: doc.planHSAOptions || {},
            planHSADetails: doc.planHSADetails || {},
            selectedPlans: doc.selectedPlans,
            processedData: doc.processedData
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save plan selections');
      }

      // Update localStorage with selected plans for the results page
      const filteredDocuments = documents.map(doc => ({
        ...doc.processedData,
        selectedPlans: doc.selectedPlans,
        planQuoteTypes: doc.planQuoteTypes || {},
        planHSAOptions: doc.planHSAOptions || {},
        planHSADetails: doc.planHSADetails || {}
      }));

      localStorage.setItem('parsedBenefitsDocuments', JSON.stringify(filteredDocuments));
      
      // Navigate to results
      router.push('/quote-tool/document-parser/results');
    } catch (err) {
      setError('Failed to save plan selections. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header pages={["Quote Tool", "Document Parser"]} page="Plan Selection">
          <h2 className="text-xl font-semibold">Plan Selection</h2>
        </Header>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading processed documents...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header pages={["Quote Tool", "Document Parser"]} page="Plan Selection">
        <h2 className="text-xl font-semibold">Plan Selection</h2>
      </Header>

      <div className="space-y-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold">Select Plans for Comparison</h2>
            <div className="text-sm text-muted-foreground">
              Select at least one plan to continue
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                Click on plan cards to select them. You can select multiple plans and configure HSA options for each.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {documents.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Documents Found</AlertTitle>
            <AlertDescription>
              No processed documents were found. Please go back and upload documents first.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {documents.map((document) => (
              <Card key={document.documentId} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary/10 rounded-lg p-2">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{document.fileName}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {document.carrierName} • {document.detectedPlans.length} plan{document.detectedPlans.length !== 1 ? 's' : ''} detected
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(document.documentId)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Plan Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-medium">Available Plans</Label>
                      <div className="text-sm text-muted-foreground">
                        {document.selectedPlans.length} of {document.detectedPlans.length} selected
                      </div>
                    </div>
                    {document.detectedPlans.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No plans detected in this document.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {document.detectedPlans.map((plan) => {
                          const isSelected = document.selectedPlans.includes(plan.planOptionName);
                          return (
                            <div 
                              key={plan.planOptionName} 
                              className={`
                                relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                                ${isSelected 
                                  ? 'border-primary bg-primary/5 shadow-md' 
                                  : 'border-gray-200 hover:border-primary/50 hover:shadow-sm'
                                }
                              `}
                              onClick={() => {
                                if (isSelected) {
                                  updateSelectedPlans(document.documentId, document.selectedPlans.filter(p => p !== plan.planOptionName));
                                } else {
                                  updateSelectedPlans(document.documentId, [...document.selectedPlans, plan.planOptionName]);
                                }
                              }}
                            >
                              {/* Plan Header with Selection */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-gray-900">{plan.planOptionName}</h3>
                                  <div className="text-xl font-bold text-primary mt-1">
                                    ${plan.totalMonthlyPremium.toLocaleString()}/mo
                                  </div>
                                </div>
                                <div className="ml-3">
                                  {isSelected ? (
                                    <div className="flex items-center space-x-1">
                                      <CheckCircle className="h-5 w-5 text-primary" />
                                      <span className="text-xs font-medium text-primary">Selected</span>
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                                  )}
                                </div>
                              </div>

                              {/* Quote Type */}
                              <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                                <Label className="text-xs font-medium text-gray-600 mb-1 block">Quote Type</Label>
                                <QuoteTypeSelector
                                  documentId={document.documentId}
                                  planName={plan.planOptionName}
                                  currentQuoteType={document.planQuoteTypes?.[plan.planOptionName] || 'Current'}
                                  availableTypes={getAvailableQuoteTypes()}
                                  onQuoteTypeChange={updateQuoteType}
                                  onAddCustomType={addCustomQuoteType}
                                />
                              </div>

                              {/* HSA Option */}
                              <div 
                                className="border-t pt-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`hsa-${document.documentId}-${plan.planOptionName}`}
                                      checked={document.planHSAOptions?.[plan.planOptionName] || false}
                                      onCheckedChange={(checked) => updatePlanHSAOption(document.documentId, plan.planOptionName, !!checked)}
                                    />
                                    <Label 
                                      htmlFor={`hsa-${document.documentId}-${plan.planOptionName}`}
                                      className="text-sm font-medium cursor-pointer"
                                    >
                                      Include HSA
                                    </Label>
                                  </div>
                                </div>
                                
                                {/* HSA Details - Compact */}
                                {document.planHSAOptions?.[plan.planOptionName] && (
                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div>
                                      <Label className="text-xs text-gray-600">Overage ($)</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={document.planHSADetails?.[plan.planOptionName]?.overageAmount || 0}
                                        onChange={(e) => updatePlanHSADetails(
                                          document.documentId, 
                                          plan.planOptionName, 
                                          'overageAmount', 
                                          Number(e.target.value)
                                        )}
                                        className="h-7 text-xs mt-1"
                                        placeholder="0.00"
                                      />
                                    </div>
                                    
                                    <div>
                                      <Label className="text-xs text-gray-600">Wellness ($)</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={document.planHSADetails?.[plan.planOptionName]?.wellnessCoverage || 0}
                                        onChange={(e) => updatePlanHSADetails(
                                          document.documentId, 
                                          plan.planOptionName, 
                                          'wellnessCoverage', 
                                          Number(e.target.value)
                                        )}
                                        className="h-7 text-xs mt-1"
                                        placeholder="0.00"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => router.push('/quote-tool/document-parser')}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </Button>

          <Button
            onClick={handleProceedToComparison}
            disabled={documents.length === 0 || isSaving || documents.every(doc => doc.selectedPlans.length === 0)}
            size="lg"
          >
            {isSaving ? 'Saving...' : 'Continue to Comparison'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </>
  );
}