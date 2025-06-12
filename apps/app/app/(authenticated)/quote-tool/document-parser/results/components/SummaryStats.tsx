interface ParsedDocument {
  originalFileName: string;
  category: string;
  processedData?: {
    metadata: {
      carrierName: string;
    };
    planOptions?: Array<{
      planOptionName: string;
      carrierProposals: Array<{
        carrierName: string;
        totalMonthlyPremium: number;
      }>;
    }>;
  };
  metadata: {
    carrierName: string;
    totalProposedMonthlyPlanPremium?: number;
  };
  coverages: Array<{
    monthlyPremium: number;
  }>;
}

interface SummaryStatsProps {
  parsedDocuments: ParsedDocument[];
}

export default function SummaryStats({ parsedDocuments }: SummaryStatsProps) {
  // Group documents by carrier
  const carrierGroups = parsedDocuments.reduce((acc, doc) => {
    let carrierName = 'Unknown Carrier';
    
    if (doc.processedData?.metadata?.carrierName) {
      carrierName = doc.processedData.metadata.carrierName;
    } else if (doc.metadata?.carrierName) {
      carrierName = doc.metadata.carrierName;
    } else if (doc.coverages && doc.coverages.length > 0 && (doc.coverages[0] as any).carrierName) {
      carrierName = (doc.coverages[0] as any).carrierName;
    }
    
    if (!acc[carrierName]) {
      acc[carrierName] = [];
    }
    acc[carrierName].push(doc);
    return acc;
  }, {} as Record<string, ParsedDocument[]>);

  // Calculate premium for each carrier
  const calculateCarrierPremium = (docs: ParsedDocument[]) => {
    return docs.reduce((sum, doc) => {
      let premium = 0;
      
      if (doc.processedData?.planOptions?.[0]?.carrierProposals?.[0]?.totalMonthlyPremium) {
        premium = doc.processedData.planOptions[0].carrierProposals[0].totalMonthlyPremium;
      } else if ((doc.processedData?.metadata as any)?.totalProposedMonthlyPlanPremium) {
        premium = (doc.processedData?.metadata as any)?.totalProposedMonthlyPlanPremium;
      } else if (doc.metadata?.totalProposedMonthlyPlanPremium) {
        premium = doc.metadata.totalProposedMonthlyPlanPremium;
      } else {
        premium = doc.coverages?.reduce((covSum, cov) => covSum + (cov.monthlyPremium || 0), 0) || 0;
      }
      
      return sum + premium;
    }, 0);
  };

  const premiums = Object.values(carrierGroups).map(docs => calculateCarrierPremium(docs));
  const minPremium = Math.min(...premiums);
  const maxPremium = Math.max(...premiums);

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
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
            ${minPremium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - 
            ${maxPremium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
}