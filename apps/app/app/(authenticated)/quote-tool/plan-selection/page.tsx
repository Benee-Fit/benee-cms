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
import { Switch } from '@repo/design-system/components/ui/switch';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Textarea } from '@repo/design-system/components/ui/textarea';
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
  Shield
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
  documentType: 'Current' | 'Renegotiated' | 'Alternative';
  detectedPlans: DetectedPlan[];
  processedData: any;
  selectedPlans: string[];
  includeHSA: boolean;
  hsaDetails?: {
    employerContribution: number;
    employeeContribution: number;
    maxAnnualContribution: number;
    eligibilityRequirements: string;
  };
}

interface HSADetails {
  employerContribution: number;
  employeeContribution: number;
  maxAnnualContribution: number;
  eligibilityRequirements: string;
}

export default function PlanSelectionPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentWithPlans[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
          
          return {
            documentId,
            fileName: result.originalFileName || `Document ${index + 1}`,
            carrierName,
            documentType: result.category || 'Current',
            detectedPlans,
            processedData: result,
            selectedPlans: [],
            includeHSA: false,
            hsaDetails: {
              employerContribution: 1000,
              employeeContribution: 2000,
              maxAnnualContribution: 4300,
              eligibilityRequirements: 'Must be enrolled in high-deductible health plan'
            }
          };
        });

        setDocuments(documentsWithPlans);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading documents:', err);
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

  // Update document type
  const updateDocumentType = (documentId: string, type: 'Current' | 'Renegotiated' | 'Alternative') => {
    setDocuments(prev => prev.map(doc => 
      doc.documentId === documentId 
        ? { ...doc, documentType: type }
        : doc
    ));
  };

  // Update selected plans for a document
  const updateSelectedPlans = (documentId: string, selectedPlans: string[]) => {
    setDocuments(prev => prev.map(doc => 
      doc.documentId === documentId 
        ? { ...doc, selectedPlans }
        : doc
    ));
  };

  // Update HSA inclusion
  const updateHSAInclusion = (documentId: string, includeHSA: boolean) => {
    setDocuments(prev => prev.map(doc => 
      doc.documentId === documentId 
        ? { ...doc, includeHSA }
        : doc
    ));
  };

  // Update HSA details
  const updateHSADetails = (documentId: string, hsaDetails: HSADetails) => {
    setDocuments(prev => prev.map(doc => 
      doc.documentId === documentId 
        ? { ...doc, hsaDetails }
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
            documentType: doc.documentType,
            selectedPlans: doc.selectedPlans,
            includeHSA: doc.includeHSA,
            hsaDetails: doc.hsaDetails,
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
        documentType: doc.documentType,
        includeHSA: doc.includeHSA,
        hsaDetails: doc.hsaDetails
      }));

      localStorage.setItem('parsedBenefitsDocuments', JSON.stringify(filteredDocuments));
      
      // Navigate to results
      router.push('/quote-tool/document-parser/results');
    } catch (err) {
      console.error('Error saving plan selections:', err);
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Select Plans for Comparison</h2>
          <p className="text-muted-foreground">
            Review detected plans and select which ones to include in your market comparison.
          </p>
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
                  {/* Document Type Selection */}
                  <div className="space-y-2">
                    <Label htmlFor={`doc-type-${document.documentId}`}>Document Type</Label>
                    <Select
                      value={document.documentType}
                      onValueChange={(value: 'Current' | 'Renegotiated' | 'Alternative') => 
                        updateDocumentType(document.documentId, value)
                      }
                    >
                      <SelectTrigger id={`doc-type-${document.documentId}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Current">Current Plan</SelectItem>
                        <SelectItem value="Renegotiated">Renegotiated</SelectItem>
                        <SelectItem value="Alternative">Alternative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Plan Selection */}
                  <div className="space-y-3">
                    <Label>Available Plans</Label>
                    {document.detectedPlans.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No plans detected in this document.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {document.detectedPlans.map((plan) => (
                          <div
                            key={plan.planOptionName}
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              document.selectedPlans.includes(plan.planOptionName)
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => {
                              const isSelected = document.selectedPlans.includes(plan.planOptionName);
                              if (isSelected) {
                                // Deselect if clicking the already selected plan
                                updateSelectedPlans(document.documentId, []);
                              } else {
                                // Select only this plan (single selection)
                                updateSelectedPlans(document.documentId, [plan.planOptionName]);
                              }
                            }}
                          >
                            <div className="flex flex-col h-full">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <h4 className="font-medium">{plan.planOptionName}</h4>
                                    {document.selectedPlans.includes(plan.planOptionName) && (
                                      <Badge variant="default" className="text-xs mt-1">Selected</Badge>
                                    )}
                                  </div>
                                  <div className="text-lg font-semibold text-primary whitespace-nowrap">
                                    ${plan.totalMonthlyPremium.toLocaleString()}/mo
                                  </div>
                                </div>
                                
                                {plan.rateGuarantee && (
                                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                    <Shield className="h-3 w-3" />
                                    <span>{plan.rateGuarantee}</span>
                                  </div>
                                )}

                                <div className="flex flex-wrap gap-1">
                                  {plan.coverageTypes.map((coverage) => (
                                    <Badge key={coverage} variant="outline" className="text-xs">
                                      {coverage}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* HSA Configuration */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`hsa-${document.documentId}`}>Include Health Spending Account (HSA)</Label>
                      <Switch
                        id={`hsa-${document.documentId}`}
                        checked={document.includeHSA}
                        onCheckedChange={(checked) => updateHSAInclusion(document.documentId, checked)}
                      />
                    </div>

                    {document.includeHSA && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="space-y-2">
                          <Label htmlFor={`employer-contrib-${document.documentId}`}>
                            Employer Contribution ($)
                          </Label>
                          <Input
                            id={`employer-contrib-${document.documentId}`}
                            type="number"
                            value={document.hsaDetails?.employerContribution || 0}
                            onChange={(e) => updateHSADetails(document.documentId, {
                              ...document.hsaDetails!,
                              employerContribution: Number(e.target.value)
                            })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`employee-contrib-${document.documentId}`}>
                            Employee Contribution ($)
                          </Label>
                          <Input
                            id={`employee-contrib-${document.documentId}`}
                            type="number"
                            value={document.hsaDetails?.employeeContribution || 0}
                            onChange={(e) => updateHSADetails(document.documentId, {
                              ...document.hsaDetails!,
                              employeeContribution: Number(e.target.value)
                            })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`max-contrib-${document.documentId}`}>
                            Max Annual Contribution ($)
                          </Label>
                          <Input
                            id={`max-contrib-${document.documentId}`}
                            type="number"
                            value={document.hsaDetails?.maxAnnualContribution || 0}
                            onChange={(e) => updateHSADetails(document.documentId, {
                              ...document.hsaDetails!,
                              maxAnnualContribution: Number(e.target.value)
                            })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`eligibility-${document.documentId}`}>
                            Eligibility Requirements
                          </Label>
                          <Textarea
                            id={`eligibility-${document.documentId}`}
                            value={document.hsaDetails?.eligibilityRequirements || ''}
                            onChange={(e) => updateHSADetails(document.documentId, {
                              ...document.hsaDetails!,
                              eligibilityRequirements: e.target.value
                            })}
                            rows={2}
                          />
                        </div>
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