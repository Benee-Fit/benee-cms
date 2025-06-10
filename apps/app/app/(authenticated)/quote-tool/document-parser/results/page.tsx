'use client';


import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/design-system/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@repo/design-system/components/ui/alert';
import { Info, RefreshCw, Clipboard, Database } from 'lucide-react';
import { Header } from '../../../components/header';
// Import ComparisonContainer component
import ComparisonContainer from './components/comparison-container';

// Define the parsed document type
interface ParsedDocument {
  originalFileName: string;
  category: string;
  processedData?: {
    metadata: {
      documentType: string;
      clientName: string;
      carrierName: string;
      primaryCarrierName?: string;
      effectiveDate: string;
      quoteDate: string;
      policyNumber?: string;
      planOptionName?: string;
      totalProposedMonthlyPlanPremium?: number;
      fileName: string;
      fileCategory: string;
      planOptionTotals?: {
        planOptionName: string;
        totalMonthlyPremium: number;
      }[];
      rateGuarantees?: string;
    };
    coverages: {
      coverageType: string;
      carrierName: string;
      planOptionName: string;
      premium: number;
      monthlyPremium: number;
      unitRate: number;
      unitRateBasis: string;
      volume: number;
      lives: number;
      benefitDetails: Record<string, unknown>;
    }[];
    planNotes: { note: string }[];
  };
  metadata: {
    documentType: string;
    clientName: string;
    carrierName: string;
    primaryCarrierName?: string;
    effectiveDate: string;
    quoteDate: string;
    policyNumber?: string;
    planOptionName?: string;
    totalProposedMonthlyPlanPremium?: number;
    fileName: string;
    fileCategory: string;
    planOptionTotals?: {
      planOptionName: string;
      totalMonthlyPremium: number;
    }[];
    rateGuarantees?: string;
  };
  coverages: {
    coverageType: string;
    carrierName: string;
    planOptionName: string;
    premium: number;
    monthlyPremium: number;
    unitRate: number;
    unitRateBasis: string;
    volume: number;
    lives: number;
    benefitDetails: Record<string, unknown>;
  }[];
  planNotes: { note: string }[];
}

export default function DocumentParserResultsPage() {
  
  const router = useRouter();
  const [parsedDocuments, setParsedDocuments] = useState<ParsedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [companyName, setCompanyName] = useState<string>('');

  useEffect(() => {
    console.log('[DEBUG] ===== Document Parser Results Page =====');
    console.log('[DEBUG] Checking localStorage for parsed documents');
    
    try {
      const storedData = localStorage.getItem('parsedBenefitsDocuments');
      const questionnaireData = localStorage.getItem('quoteQuestionnaireResults');
      console.log('[DEBUG] Found stored data, attempting to parse JSON');
      
      // Load company name from questionnaire data
      if (questionnaireData) {
        try {
          const questionnaire = JSON.parse(questionnaireData);
          if (questionnaire.companyName) {
            setCompanyName(questionnaire.companyName);
            console.log('[DEBUG] Loaded company name:', questionnaire.companyName);
          }
        } catch (e) {
          console.log('[DEBUG] Error parsing questionnaire data:', e);
        }
      }
      
      if (storedData) {
        const parsedDocuments = JSON.parse(storedData) as ParsedDocument[];
        console.log(`[DEBUG] Successfully parsed JSON. Found ${parsedDocuments.length} document(s)`);
        console.log('[DEBUG] First document structure:', JSON.stringify(parsedDocuments[0], null, 2).substring(0, 500));
        
        // Normalize and repair documents if needed
        const normalizedDocuments = parsedDocuments.map((doc, index) => {
          console.log(`[DEBUG] --- Document ${index + 1}: ${doc.originalFileName || 'Unknown filename'} ---`);
          
          // Handle nested structure - if data is under processedData, extract it
          let actualDoc = doc;
          if (doc.processedData) {
            actualDoc = {
              ...doc,
              metadata: doc.processedData.metadata,
              coverages: doc.processedData.coverages,
              planNotes: doc.processedData.planNotes || []
            };
          }
          
          // Check for metadata and create default if missing
          if (!actualDoc.metadata || typeof actualDoc.metadata !== 'object') {
            console.log('[DEBUG] WARNING: Document is missing metadata - adding default metadata');
            actualDoc.metadata = {
              documentType: 'Unknown',
              clientName: 'Unknown',
              carrierName: 'Unknown Carrier',
              effectiveDate: new Date().toISOString().split('T')[0],
              quoteDate: new Date().toISOString().split('T')[0],
              fileName: actualDoc.originalFileName || `Unknown File ${index + 1}`,
              fileCategory: actualDoc.category || 'Current'
            };
          } else {
            console.log('[DEBUG] Metadata found:', Object.keys(actualDoc.metadata).length, 'properties');
            // Map primaryCarrierName to carrierName if needed
            if (actualDoc.metadata.primaryCarrierName && !actualDoc.metadata.carrierName) {
              actualDoc.metadata.carrierName = actualDoc.metadata.primaryCarrierName;
            }
          }
          
          // Check for coverages and create default if missing
          if (!actualDoc.coverages) {
            console.log('[DEBUG] ERROR: Document has no coverages property - creating default coverage');
            actualDoc.coverages = [
              {
                coverageType: 'Basic Life',
                carrierName: (actualDoc.metadata && typeof actualDoc.metadata === 'object' && 'carrierName' in actualDoc.metadata) 
                  ? String(actualDoc.metadata.carrierName) 
                  : 'Unknown Carrier',
                planOptionName: 'Default Plan',
                premium: 0,
                monthlyPremium: 0,
                unitRate: 0,
                unitRateBasis: 'per $1,000',
                volume: 0,
                lives: 0,
                benefitDetails: {
                  note: 'Coverage details could not be extracted from document'
                }
              }
            ];
          } else if (!Array.isArray(actualDoc.coverages)) {
            console.log('[DEBUG] ERROR: Document coverages is not an array - converting to array with default coverage');
            actualDoc.coverages = [
              {
                coverageType: 'Basic Life',
                carrierName: (actualDoc.metadata && typeof actualDoc.metadata === 'object' && 'carrierName' in actualDoc.metadata) 
                  ? String(actualDoc.metadata.carrierName) 
                  : 'Unknown Carrier',
                planOptionName: 'Default Plan',
                premium: 0,
                monthlyPremium: 0,
                unitRate: 0,
                unitRateBasis: 'per $1,000',
                volume: 0,
                lives: 0,
                benefitDetails: {
                  note: 'Coverage details could not be extracted from document'
                }
              }
            ];
          } else if (actualDoc.coverages.length === 0) {
            console.log('[DEBUG] WARNING: Document has empty coverages array - adding default coverage');
            actualDoc.coverages.push({
              coverageType: 'Basic Life',
              carrierName: (actualDoc.metadata && typeof actualDoc.metadata === 'object' && 'carrierName' in actualDoc.metadata) 
                ? String(actualDoc.metadata.carrierName) 
                : 'Unknown Carrier',
              planOptionName: 'Default Plan',
              premium: 0,
              monthlyPremium: 0,
              unitRate: 0,
              unitRateBasis: 'per $1,000',
              volume: 0,
              lives: 0,
              benefitDetails: {
                note: 'Coverage details could not be extracted from document'
              }
            });
          } else {
            console.log('[DEBUG] Coverages found:', actualDoc.coverages.length);
            
            // Validate each coverage has required fields
            actualDoc.coverages = actualDoc.coverages.map(coverage => {
              if (!coverage || typeof coverage !== 'object') {
                console.log('[DEBUG] Invalid coverage item found - replacing with valid default');
                return {
                  coverageType: 'Basic Life',
                  carrierName: (actualDoc.metadata && typeof actualDoc.metadata === 'object' && 'carrierName' in actualDoc.metadata) 
                    ? String(actualDoc.metadata.carrierName) 
                    : 'Unknown Carrier',
                  planOptionName: 'Default Plan',
                  premium: 0,
                  monthlyPremium: 0,
                  unitRate: 0,
                  unitRateBasis: 'per $1,000',
                  volume: 0,
                  lives: 0,
                  benefitDetails: { note: 'Coverage details could not be extracted from document' }
                };
              } else {
                // Ensure all required fields exist and map carrier name properly
                return {
                  coverageType: coverage.coverageType || 'Basic Life',
                  carrierName: coverage.carrierName || ((actualDoc.metadata && typeof actualDoc.metadata === 'object' && 'carrierName' in actualDoc.metadata) 
                    ? String(actualDoc.metadata.carrierName) 
                    : 'Unknown Carrier'),
                  planOptionName: coverage.planOptionName || 'Default Plan',
                  premium: coverage.premium || 0,
                  monthlyPremium: coverage.monthlyPremium || 0,
                  unitRate: coverage.unitRate || 0,
                  unitRateBasis: coverage.unitRateBasis || 'per $1,000',
                  volume: coverage.volume || 0,
                  lives: coverage.lives || 0,
                  benefitDetails: coverage.benefitDetails || { note: 'Limited coverage details were extracted' }
                };
              }
            });
          }
          
          return actualDoc;
        });
        
        // Update state with normalized documents
        setParsedDocuments(normalizedDocuments);
        console.log('[DEBUG] Document normalization complete');
        
        // Check if we actually have coverage data in any document
        const hasCoverages = normalizedDocuments.some(
          doc => Array.isArray(doc.coverages) && doc.coverages.length > 0
        );
        
        if (!hasCoverages) {
          console.log('[DEBUG] CRITICAL ERROR: No coverage data found in any document');
          setError('Documents found, but no coverage data detected in parsed results.');
        }
      } else {
        console.log('[DEBUG] No stored parsed documents found in localStorage');
        setError('No parsed document data found in storage.');
      }
    } catch (e) {
      console.log('[DEBUG] Error parsing stored documents:', e instanceof Error ? e.message : 'Unknown error');
      setError('Failed to load parsed data. It might be corrupted.');
    } finally {
      setIsLoading(false);
      console.log('[DEBUG] ===== End Document Parser Results Page Initialization =====');
    }
  }, []);

  // Navigate back to parser page
  const handleReturnToParser = () => {
    router.push('/quote-tool/document-parser');
  };

  // Clear results and return to parser
  const handleClearAndReturn = () => {
    localStorage.removeItem('parsedBenefitsDocuments');
    router.push('/quote-tool/document-parser');
  };


  // Toggle raw data view
  const toggleRawData = () => {
    setShowRawData(!showRawData);
  };


  if (isLoading) {
    return (
      <>
        <Header pages={["Quote Tool"]} page="Document Parser Results">
          <h2 className="text-xl font-semibold">Results</h2>
        </Header>
        
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="bg-muted/50 flex-1 min-h-[50vh] md:min-h-min rounded-xl p-6">
            <div className="flex justify-center items-center h-40">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Loading results...</span>
            </div>
          </div>
        </div>
      </>
    );
  }


  return (
    <>
      <Header pages={["Quote Tool"]} page="Document Parser Results">
        <h2 className="text-xl font-semibold">Market Comparison</h2>
      </Header>
      
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="bg-muted/50 flex-1 min-h-[50vh] md:min-h-min rounded-xl p-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <Info className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Empty Results Notice */}
          {parsedDocuments.length === 0 && !error && (
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertTitle>No Results</AlertTitle>
              <AlertDescription>
                No parsed document data found. Please upload and process documents first.
              </AlertDescription>
            </Alert>
          )}
      
          {/* Results Summary */}
          {parsedDocuments.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {companyName || 'Market Comparison'}
                  </h2>
                  <p className="text-muted-foreground">
                    {parsedDocuments.length} document{parsedDocuments.length !== 1 ? 's' : ''} analyzed
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={toggleRawData}>
                    {showRawData ? (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        <span>Show Comparison View</span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="h-4 w-4 mr-2" />
                        <span>Show Raw JSON</span>
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleReturnToParser}>
                    Upload More
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleClearAndReturn}>
                    Clear & Return
                  </Button>
                </div>
              </div>
              
              {showRawData ? (
                // Raw JSON Data View
                <div className="mt-6 space-y-6">
                  {parsedDocuments.map((doc, index) => (
                    <details key={index} className="bg-white rounded-lg shadow-sm open:shadow-md transition-all duration-200">
                      <summary className="text-lg font-medium p-4 cursor-pointer hover:bg-gray-50">
                        {doc.metadata?.carrierName || 'Unknown Carrier'} - {doc.originalFileName || 'Unnamed Document'}
                        <span className="ml-2 text-sm px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {doc.category || 'Uncategorized'}
                        </span>
                      </summary>
                      <div className="p-4 pt-0 border-t">
                        <pre className="text-xs overflow-auto bg-muted/10 p-4 rounded-md max-h-96">
                          {JSON.stringify(doc, null, 2)}
                        </pre>
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                // Comparison View
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <ComparisonContainer />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
