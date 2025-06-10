import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { 
  Building2, 
  Calendar, 
  FileText, 
  Shield, 
  DollarSign,
  Users,
  Clock,
  TrendingUp
} from 'lucide-react';
// Use the local interface definition to match comparison-container
interface ParsedDocument {
  originalFileName: string;
  category: string;
  processedData?: {
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
      benefitDetails: Record<string, unknown>;
    }>;
    planNotes: Array<{ note: string }>;
  };
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
    benefitDetails: Record<string, unknown>;
  }>;
  planNotes: Array<{ note: string }>;
}

interface CarrierOverviewCardsProps {
  parsedDocuments: ParsedDocument[];
}

export default function CarrierOverviewCards({ parsedDocuments }: CarrierOverviewCardsProps) {
  // Group documents by carrier - check multiple sources for carrier name
  const carrierGroups = parsedDocuments.reduce((acc, doc) => {
    // Try multiple sources for carrier name
    let carrierName = 'Unknown Carrier';
    
    // First check processedData metadata (for new format)
    if ((doc as any).processedData?.metadata?.carrierName) {
      carrierName = (doc as any).processedData.metadata.carrierName;
    }
    // Then check root metadata
    else if (doc.metadata?.carrierName) {
      carrierName = doc.metadata.carrierName;
    }
    // Finally check coverages for carrier name
    else if (doc.coverages && doc.coverages.length > 0 && doc.coverages[0].carrierName) {
      carrierName = doc.coverages[0].carrierName;
    }
    
    if (!acc[carrierName]) {
      acc[carrierName] = [];
    }
    acc[carrierName].push(doc);
    return acc;
  }, {} as Record<string, ParsedDocument[]>);

  // Calculate summary metrics for each carrier
  const calculateCarrierMetrics = (docs: ParsedDocument[]) => {
    const totalMonthlyPremium = docs.reduce((sum, doc) => {
      // Check processedData first, then root metadata
      const premium = doc.processedData?.metadata?.totalProposedMonthlyPlanPremium ||
                     doc.metadata?.totalProposedMonthlyPlanPremium || 
                     doc.processedData?.coverages?.reduce((covSum, cov) => covSum + (cov.monthlyPremium || 0), 0) ||
                     doc.coverages?.reduce((covSum, cov) => covSum + (cov.monthlyPremium || 0), 0) || 
                     0;
      return sum + premium;
    }, 0);

    const uniqueCoverageTypes = new Set<string>();
    docs.forEach(doc => {
      // Check both processedData and root coverages
      const coverages = doc.processedData?.coverages || doc.coverages || [];
      coverages.forEach(cov => {
        if (cov.coverageType) uniqueCoverageTypes.add(cov.coverageType);
      });
    });

    const totalLives = docs.reduce((sum, doc) => {
      const coverages = doc.processedData?.coverages || doc.coverages || [];
      const lives = coverages.reduce((covSum, cov) => 
        Math.max(covSum, cov.lives || 0), 0) || 0;
      return Math.max(sum, lives);
    }, 0);

    return {
      totalMonthlyPremium,
      coverageCount: uniqueCoverageTypes.size,
      documentCount: docs.length,
      totalLives,
      rateGuarantee: docs[0]?.processedData?.metadata?.rateGuarantees || 
                     docs[0]?.metadata?.rateGuarantees || 
                     'Not specified'
    };
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Carrier Overview</h3>
        <p className="text-sm text-gray-600">High-level summary of each carrier's proposal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.entries(carrierGroups).map(([carrierName, docs]) => {
          const metrics = calculateCarrierMetrics(docs);
          const metadata = docs[0]?.processedData?.metadata || docs[0]?.metadata;
          const category = docs[0]?.category || 'Current';

          return (
            <Card key={carrierName} className="relative overflow-hidden hover:shadow-xl transition-all bg-white border-0 shadow-md">
              {/* Category Badge - Top Right Corner */}
              <div className="absolute top-3 right-3">
                <Badge 
                  variant={category === 'Alternative' ? 'secondary' : 
                          category === 'Renegotiated' ? 'default' : 'outline'}
                  className="text-xs"
                >
                  {category}
                </Badge>
              </div>

              <CardContent className="p-5">
                {/* Header Row - Carrier, Client, and Premium */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{carrierName}</h3>
                    {metadata?.clientName && (
                      <p className="text-sm text-gray-600">{metadata.clientName}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      ${metrics.totalMonthlyPremium.toLocaleString('en-US', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      })}
                    </div>
                    <p className="text-xs text-gray-500">per month</p>
                  </div>
                </div>

                {/* Date Prepared */}
                {metadata?.quoteDate && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500">
                      Prepared: {new Date(metadata.quoteDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                )}

                {/* Key Metrics Bar */}
                <div className="flex items-center justify-between py-3 px-4 -mx-5 bg-gray-50 border-y border-gray-100">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-0.5">Rate Guarantee</p>
                    <p className="text-sm font-semibold text-gray-900">{metrics.rateGuarantee}</p>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-0.5">Lives</p>
                    <p className="text-sm font-semibold text-gray-900">{metrics.totalLives || 'N/A'}</p>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-0.5">Effective</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {metadata?.effectiveDate ? new Date(metadata.effectiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
                    </p>
                  </div>
                </div>

                {/* Coverage Types */}
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Coverage Includes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set(
                      docs.flatMap(doc => {
                        const coverages = doc.processedData?.coverages || doc.coverages || [];
                        return coverages.map(cov => cov.coverageType).filter(Boolean);
                      })
                    )).map((coverage, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-xs font-medium text-blue-700">
                        {coverage}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Info - Subtle */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{metadata?.documentType || 'Quote'}</span>
                    {metadata?.reportPreparedBy && (
                      <span className="truncate max-w-[150px]" title={metadata.reportPreparedBy}>
                        by {metadata.reportPreparedBy.split(',')[0]}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Total Carriers</p>
            <p className="text-2xl font-bold text-gray-900">{Object.keys(carrierGroups).length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Documents</p>
            <p className="text-2xl font-bold text-gray-900">{parsedDocuments.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Premium Range</p>
            <p className="text-2xl font-bold text-gray-900">
              ${Math.min(...Object.values(carrierGroups).map(docs => calculateCarrierMetrics(docs).totalMonthlyPremium)).toLocaleString()} - 
              ${Math.max(...Object.values(carrierGroups).map(docs => calculateCarrierMetrics(docs).totalMonthlyPremium)).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}