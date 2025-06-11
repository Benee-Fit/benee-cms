'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import { Badge } from '@repo/design-system/components/ui/badge';
import { 
  FileText, 
  Eye, 
  Download, 
  Calendar,
  Building,
  DollarSign,
  Users,
  Shield
} from 'lucide-react';

interface DocumentPreviewProps {
  document: {
    documentId: string;
    fileName: string;
    carrierName: string;
    documentType: 'Current' | 'Renegotiated' | 'Alternative';
    detectedPlans: {
      planOptionName: string;
      totalMonthlyPremium: number;
      coverageTypes: string[];
      rateGuarantee?: string;
    }[];
    processedData: any;
  };
}

export default function DocumentPreview({ document }: DocumentPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract metadata from processed data
  const metadata = document.processedData?.metadata || {};
  const effectiveDate = metadata.effectiveDate ? new Date(metadata.effectiveDate).toLocaleDateString() : 'Not specified';
  const quoteDate = metadata.quoteDate ? new Date(metadata.quoteDate).toLocaleDateString() : 'Not specified';
  
  // Calculate total premium across all plans
  const totalPremium = document.detectedPlans.reduce((sum, plan) => sum + plan.totalMonthlyPremium, 0);

  // Get unique coverage types
  const allCoverageTypes = [...new Set(document.detectedPlans.flatMap(plan => plan.coverageTypes))];

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'Current': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Renegotiated': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Alternative': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{document.fileName}</CardTitle>
              <p className="text-sm text-muted-foreground">{document.carrierName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`text-xs ${getDocumentTypeColor(document.documentType)}`}>
              {document.documentType}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-sm font-medium">{document.detectedPlans.length}</div>
            <div className="text-xs text-muted-foreground">Plans</div>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-sm font-medium">${totalPremium.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total/Month</div>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-sm font-medium">{allCoverageTypes.length}</div>
            <div className="text-xs text-muted-foreground">Coverage Types</div>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-sm font-medium">{quoteDate.split('/')[0]}</div>
            <div className="text-xs text-muted-foreground">Quote Date</div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Document Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Document Information</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Effective Date:</span>
                    <span>{effectiveDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quote Date:</span>
                    <span>{quoteDate}</span>
                  </div>
                  {metadata.policyNumber && (
                    <div className="flex justify-between">
                      <span>Policy Number:</span>
                      <span>{metadata.policyNumber}</span>
                    </div>
                  )}
                  {metadata.clientName && (
                    <div className="flex justify-between">
                      <span>Client:</span>
                      <span>{metadata.clientName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Coverage Overview</h4>
                <div className="flex flex-wrap gap-1">
                  {allCoverageTypes.map((coverage) => (
                    <Badge key={coverage} variant="outline" className="text-xs">
                      {coverage}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Plan Details */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Detected Plans</h4>
              {document.detectedPlans.map((plan) => (
                <div key={plan.planOptionName} className="border rounded-lg p-3 bg-muted/25">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">{plan.planOptionName}</h5>
                    <span className="text-sm font-medium">${plan.totalMonthlyPremium.toLocaleString()}/month</span>
                  </div>
                  
                  {plan.rateGuarantee && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Rate Guarantee: {plan.rateGuarantee}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-1">
                    {plan.coverageTypes.map((coverage) => (
                      <Badge key={coverage} variant="outline" className="text-xs">
                        {coverage}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-2">
              <Button variant="outline" size="sm">
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-3 w-3 mr-1" />
                View Raw Data
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}