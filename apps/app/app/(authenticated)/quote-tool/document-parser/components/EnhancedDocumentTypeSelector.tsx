'use client';

import React from 'react';
import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/design-system/components/ui/tooltip';
import { 
  FileText, 
  RefreshCw, 
  TrendingUp, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface DocumentType {
  id: 'Current' | 'Renegotiated' | 'Alternative';
  name: string;
  description: string;
  detailedDescription: string;
  icon: React.ReactNode;
  color: string;
  examples: string[];
  tips: string[];
}

interface EnhancedDocumentTypeSelectorProps {
  activeCategory: 'Current' | 'Renegotiated' | 'Alternative';
  onCategoryChange: (category: 'Current' | 'Renegotiated' | 'Alternative') => void;
  fileCount: Record<string, number>;
}

const documentTypes: DocumentType[] = [
  {
    id: 'Current',
    name: 'Current Plan',
    description: 'Existing baseline coverage documents',
    detailedDescription: 'Upload your current insurance plan documents to establish a baseline for comparison. These documents represent your existing coverage terms, premiums, and benefits.',
    icon: <FileText className="h-6 w-6" />,
    color: 'blue',
    examples: [
      'Current policy renewal quotes',
      'Existing plan summaries',
      'Active coverage documents'
    ],
    tips: [
      'Include all current carrier documents',
      'Ensure documents are from the current policy period',
      'Multiple plan options can be uploaded'
    ]
  },
  {
    id: 'Renegotiated',
    name: 'Renegotiated',
    description: 'Updated terms from current carrier',
    detailedDescription: 'Upload renegotiated quotes from your current insurance carrier. These represent improved terms, adjusted pricing, or modified coverage options from your existing provider.',
    icon: <RefreshCw className="h-6 w-6" />,
    color: 'green',
    examples: [
      'Renegotiated renewal quotes',
      'Updated pricing proposals',
      'Modified benefit structures'
    ],
    tips: [
      'Compare against current plan documents',
      'Look for pricing improvements',
      'Note any benefit changes'
    ]
  },
  {
    id: 'Alternative',
    name: 'Alternative',
    description: 'Competitive quotes from other carriers',
    detailedDescription: 'Upload quotes from alternative insurance carriers for competitive analysis. These documents help you evaluate market options and negotiate better terms.',
    icon: <TrendingUp className="h-6 w-6" />,
    color: 'purple',
    examples: [
      'Competitor carrier quotes',
      'Market alternative proposals',
      'New carrier options'
    ],
    tips: [
      'Include quotes from multiple carriers',
      'Ensure coverage levels are comparable',
      'Note any unique benefits or features'
    ]
  }
];

export default function EnhancedDocumentTypeSelector({
  activeCategory,
  onCategoryChange,
  fileCount
}: EnhancedDocumentTypeSelectorProps) {
  
  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: {
        border: isActive ? 'border-blue-500' : 'border-gray-200 hover:border-blue-300',
        bg: isActive ? 'bg-blue-50' : 'hover:bg-blue-25',
        icon: isActive ? 'text-blue-600' : 'text-blue-500',
        badge: 'bg-blue-100 text-blue-800'
      },
      green: {
        border: isActive ? 'border-green-500' : 'border-gray-200 hover:border-green-300',
        bg: isActive ? 'bg-green-50' : 'hover:bg-green-25',
        icon: isActive ? 'text-green-600' : 'text-green-500',
        badge: 'bg-green-100 text-green-800'
      },
      purple: {
        border: isActive ? 'border-purple-500' : 'border-gray-200 hover:border-purple-300',
        bg: isActive ? 'bg-purple-50' : 'hover:bg-purple-25',
        icon: isActive ? 'text-purple-600' : 'text-purple-500',
        badge: 'bg-purple-100 text-purple-800'
      }
    };
    
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">Document Type</h3>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-sm">
              <p>Choose the appropriate category for your documents. This helps the AI parser understand the context and provide better analysis.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {documentTypes.map((type) => {
            const isActive = activeCategory === type.id;
            const count = fileCount[type.id] || 0;
            const colorClasses = getColorClasses(type.color, isActive);
            
            return (
              <Tooltip key={type.id}>
                <TooltipTrigger asChild>
                  <Card
                    className={`cursor-pointer transition-all duration-200 border-2 ${colorClasses.border} ${colorClasses.bg}`}
                    onClick={() => onCategoryChange(type.id)}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-2 text-center">
                        <div className="flex flex-col items-center space-y-1">
                          <div className={`${colorClasses.icon}`}>
                            {type.icon}
                          </div>
                          {count > 0 && (
                            <Badge className={colorClasses.badge}>
                              {count} file{count !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {type.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {type.description}
                          </p>
                        </div>
                        
                        {isActive && (
                          <div className="text-xs text-gray-500">
                            Click to upload {type.name.toLowerCase()} documents
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                
                <TooltipContent 
                  side="bottom" 
                  className="max-w-md p-4 bg-white border border-gray-200 shadow-lg"
                  sideOffset={8}
                  avoidCollisions={true}
                >
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {type.name}
                      </h4>
                      <p className="text-sm text-gray-800">
                        {type.detailedDescription}
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="text-xs font-medium text-gray-900 mb-1">
                        Examples:
                      </h5>
                      <ul className="text-xs text-gray-700 space-y-0.5">
                        {type.examples.map((example, index) => (
                          <li key={index} className="flex items-center space-x-1">
                            <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-xs font-medium text-gray-900 mb-1">
                        Tips:
                      </h5>
                      <ul className="text-xs text-gray-700 space-y-0.5">
                        {type.tips.map((tip, index) => (
                          <li key={index} className="flex items-center space-x-1">
                            <AlertCircle className="h-3 w-3 text-blue-600 flex-shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}