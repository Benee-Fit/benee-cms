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
import { Switch } from '@repo/design-system/components/ui/switch';
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
  planHSADetails: Record<string, { 
    coverageSingle: number; 
    coverageFamily: number; 
    wellnessSingle: number; 
    wellnessFamily: number;
    adminFee: number;
  }>; // planName -> HSA details
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
        <SelectTrigger className="w-full">
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
          
          // Initialize planQuoteTypes - only first plan of first document gets 'Current'
          const planQuoteTypes: Record<string, string> = {};
          const planHSAOptions: Record<string, boolean> = {};
          const planHSADetails: Record<string, { 
            coverageSingle: number; 
            coverageFamily: number; 
            wellnessSingle: number; 
            wellnessFamily: number;
            adminFee: number;
          }> = {};
          let isFirstPlan = index === 0;
          detectedPlans.forEach((plan, planIndex) => {
            if (plan && plan.planOptionName) {
              // Only set the first plan of the first document as 'Current'
              planQuoteTypes[plan.planOptionName] = (isFirstPlan && planIndex === 0) ? 'Current' : 'Alternative';
              planHSAOptions[plan.planOptionName] = false;
              planHSADetails[plan.planOptionName] = { 
                coverageSingle: 0, 
                coverageFamily: 0, 
                wellnessSingle: 0, 
                wellnessFamily: 0,
                adminFee: 0 
              };
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
    setDocuments(prev => {
      // If setting a plan to "Current", first remove "Current" from all other plans
      if (quoteType === 'Current') {
        return prev.map(doc => {
          const updatedQuoteTypes = { ...doc.planQuoteTypes };
          
          // Remove "Current" from all plans
          Object.keys(updatedQuoteTypes).forEach(plan => {
            if (updatedQuoteTypes[plan] === 'Current') {
              updatedQuoteTypes[plan] = 'Alternative'; // Default to Alternative when removing Current
            }
          });
          
          // Set the selected plan to "Current" if it's in this document
          if (doc.documentId === documentId) {
            updatedQuoteTypes[planName] = 'Current';
          }
          
          return { ...doc, planQuoteTypes: updatedQuoteTypes };
        });
      } else {
        // For non-Current quote types, just update normally
        return prev.map(doc => 
          doc.documentId === documentId 
            ? { 
                ...doc, 
                planQuoteTypes: {
                  ...(doc.planQuoteTypes || {}),
                  [planName]: quoteType
                }
              }
            : doc
        );
      }
    });
  };

  // Add custom quote type
  const addCustomQuoteType = (customType: string) => {
    if (customType && !customQuoteTypes.includes(customType)) {
      setCustomQuoteTypes(prev => [...prev, customType]);
    }
  };

  // Check if any plan across all documents is set to "Current"
  const hasCurrentPlan = () => {
    return documents.some(doc => 
      Object.values(doc.planQuoteTypes || {}).includes('Current')
    );
  };

  // Get available quote types for a specific plan
  const getAvailableQuoteTypesForPlan = (documentId: string, planName: string) => {
    const defaultTypes = ['GTM', 'Negotiated', 'Alternative'];
    const allTypes = [...defaultTypes, ...customQuoteTypes];
    
    // Check if this plan is already set to Current
    const isPlanCurrent = documents.find(doc => doc.documentId === documentId)
      ?.planQuoteTypes?.[planName] === 'Current';
    
    // If this plan is Current, or if no plan is Current, include "Current" as an option
    if (isPlanCurrent || !hasCurrentPlan()) {
      return ['Current', ...allTypes];
    }
    
    // Otherwise, exclude "Current" from options
    return allTypes;
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
  const updatePlanHSADetails = (documentId: string, planName: string, field: 'coverageSingle' | 'coverageFamily' | 'wellnessSingle' | 'wellnessFamily' | 'adminFee', value: number) => {
    setDocuments(prev => prev.map(doc => 
      doc.documentId === documentId 
        ? { 
            ...doc, 
            planHSADetails: {
              ...(doc.planHSADetails || {}),
              [planName]: {
                ...(doc.planHSADetails?.[planName] || { 
                  coverageSingle: 0, 
                  coverageFamily: 0, 
                  wellnessSingle: 0, 
                  wellnessFamily: 0,
                  adminFee: 0 
                }),
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
        planHSADetails: doc.planHSADetails || {},
        // Preserve the quote type data at the root level for compatibility
        quoteMeta: {
          planQuoteTypes: doc.planQuoteTypes || {},
          planHSAOptions: doc.planHSAOptions || {},
          planHSADetails: doc.planHSADetails || {}
        }
      }));

      localStorage.setItem('parsedBenefitsDocuments', JSON.stringify(filteredDocuments));
      
      // Debug: Log what we're saving to localStorage
      console.log('[DEBUG] Saving to localStorage:', {
        documentCount: filteredDocuments.length,
        planQuoteTypesPerDoc: filteredDocuments.map((doc, idx) => ({
          docIndex: idx,
          planQuoteTypes: doc.planQuoteTypes,
          quoteMeta: doc.quoteMeta
        }))
      });
      
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
            <h2 className="text-2xl font-bold">Review Plans</h2>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                Review detected plans and configure quote types and HSA options. Only one plan can be marked as "Current" at a time.
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
                    </div>
                    {document.detectedPlans.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No plans detected in this document.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {document.detectedPlans.map((plan) => {
                          const isCurrent = document.planQuoteTypes?.[plan.planOptionName] === 'Current';
                          return (
                            <div 
                              key={plan.planOptionName} 
                              className={`relative border-2 rounded-lg p-4 ${
                                isCurrent 
                                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                  : 'border-gray-200'
                              }`}
                            >
                              <div className="flex gap-4">
                                {/* Left side - Plan Info */}
                                <div className="flex-1">
                                  {/* Plan Header */}
                                  <div className="mb-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="text-lg font-semibold text-gray-900">{plan.planOptionName}</h3>
                                      {isCurrent && (
                                        <Badge className="bg-primary text-white text-xs">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Current
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-xl font-bold text-primary mt-1">
                                      ${plan.totalMonthlyPremium.toLocaleString()}/mo
                                    </div>
                                  </div>

                                  {/* Rate Guarantee */}
                                  {plan.rateGuarantee && (
                                    <div className="mb-3">
                                      <Badge variant="secondary" className="text-xs">
                                        <Shield className="h-3 w-3 mr-1" />
                                        {plan.rateGuarantee}
                                      </Badge>
                                    </div>
                                  )}

                                  {/* Coverage Types */}
                                  {plan.coverageTypes && plan.coverageTypes.length > 0 && (
                                    <div>
                                      <div className="flex flex-wrap gap-1">
                                        {plan.coverageTypes.map((coverage, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            {coverage}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Right side - Quote Type and HSA */}
                                <div className="w-64 space-y-4">
                                  {/* Quote Type */}
                                  <div>
                                    <Label className="text-xs font-medium text-gray-600 mb-1 block">Quote Type</Label>
                                    <QuoteTypeSelector
                                      documentId={document.documentId}
                                      planName={plan.planOptionName}
                                      currentQuoteType={document.planQuoteTypes?.[plan.planOptionName] || 'Current'}
                                      availableTypes={getAvailableQuoteTypesForPlan(document.documentId, plan.planOptionName)}
                                      onQuoteTypeChange={updateQuoteType}
                                      onAddCustomType={addCustomQuoteType}
                                    />
                                  </div>

                                  {/* HSA Option */}
                                  <div className="border-t pt-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <Label 
                                        htmlFor={`hsa-${document.documentId}-${plan.planOptionName}`}
                                        className="text-sm font-medium cursor-pointer"
                                      >
                                        Include HSA
                                      </Label>
                                      <Switch
                                        id={`hsa-${document.documentId}-${plan.planOptionName}`}
                                        checked={document.planHSAOptions?.[plan.planOptionName] || false}
                                        onCheckedChange={(checked) => updatePlanHSAOption(document.documentId, plan.planOptionName, !!checked)}
                                        className={document.planHSAOptions?.[plan.planOptionName] ? 'data-[state=checked]:bg-blue-600' : ''}
                                      />
                                    </div>
                                    
                                    {/* HSA Details */}
                                    {document.planHSAOptions?.[plan.planOptionName] && (
                                      <div className="space-y-3 mt-3">
                                        {/* Coverage */}
                                        <div>
                                          <Label className="text-xs font-medium text-gray-700 mb-1 block">Coverage ($)</Label>
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <Label className="text-xs text-gray-500">Single</Label>
                                              <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={document.planHSADetails?.[plan.planOptionName]?.coverageSingle || 0}
                                                onChange={(e) => updatePlanHSADetails(
                                                  document.documentId, 
                                                  plan.planOptionName, 
                                                  'coverageSingle', 
                                                  Number(e.target.value)
                                                )}
                                                className="h-7 text-xs mt-0.5"
                                                placeholder="0.00"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-xs text-gray-500">Family</Label>
                                              <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={document.planHSADetails?.[plan.planOptionName]?.coverageFamily || 0}
                                                onChange={(e) => updatePlanHSADetails(
                                                  document.documentId, 
                                                  plan.planOptionName, 
                                                  'coverageFamily', 
                                                  Number(e.target.value)
                                                )}
                                                className="h-7 text-xs mt-0.5"
                                                placeholder="0.00"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Wellness */}
                                        <div>
                                          <Label className="text-xs font-medium text-gray-700 mb-1 block">Wellness ($)</Label>
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <Label className="text-xs text-gray-500">Single</Label>
                                              <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={document.planHSADetails?.[plan.planOptionName]?.wellnessSingle || 0}
                                                onChange={(e) => updatePlanHSADetails(
                                                  document.documentId, 
                                                  plan.planOptionName, 
                                                  'wellnessSingle', 
                                                  Number(e.target.value)
                                                )}
                                                className="h-7 text-xs mt-0.5"
                                                placeholder="0.00"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-xs text-gray-500">Family</Label>
                                              <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={document.planHSADetails?.[plan.planOptionName]?.wellnessFamily || 0}
                                                onChange={(e) => updatePlanHSADetails(
                                                  document.documentId, 
                                                  plan.planOptionName, 
                                                  'wellnessFamily', 
                                                  Number(e.target.value)
                                                )}
                                                className="h-7 text-xs mt-0.5"
                                                placeholder="0.00"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Admin Fee */}
                                        <div>
                                          <Label className="text-xs font-medium text-gray-700 mb-1 block">Admin Fee ($)</Label>
                                          <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={document.planHSADetails?.[plan.planOptionName]?.adminFee || 0}
                                            onChange={(e) => updatePlanHSADetails(
                                              document.documentId, 
                                              plan.planOptionName, 
                                              'adminFee', 
                                              Number(e.target.value)
                                            )}
                                            className="h-7 text-xs"
                                            placeholder="0.00"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
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
            disabled={documents.length === 0 || isSaving}
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