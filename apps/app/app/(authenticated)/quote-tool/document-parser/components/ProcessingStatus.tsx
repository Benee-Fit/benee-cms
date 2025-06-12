'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Progress } from '@repo/design-system/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Upload,
  FileText,
  Brain,
  Save,
  Loader2,
  Info
} from 'lucide-react';

interface ProcessingStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  progress?: number;
  details?: string;
}

interface ProcessingStatusProps {
  fileName: string;
  stages: ProcessingStage[];
  currentStage?: string;
  error?: string;
  onRetry?: (strategy?: string) => void;
}

export default function ProcessingStatus({ 
  fileName, 
  stages, 
  currentStage, 
  error,
  onRetry 
}: ProcessingStatusProps) {
  
  const getStageIcon = (stage: ProcessingStage) => {
    const icons: Record<string, React.ReactElement> = {
      upload: <Upload className="h-5 w-5" />,
      extraction: <FileText className="h-5 w-5" />,
      parsing: <Brain className="h-5 w-5" />,
      saving: <Save className="h-5 w-5" />
    };
    
    return icons[stage.id] || <Clock className="h-5 w-5" />;
  };

  const getStageStatus = (stage: ProcessingStage) => {
    switch (stage.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getOverallProgress = () => {
    const completedStages = stages.filter(stage => stage.status === 'completed').length;
    return (completedStages / stages.length) * 100;
  };

  const getEstimatedTime = (stage: ProcessingStage) => {
    const timeEstimates: Record<string, string> = {
      upload: '~30 seconds',
      extraction: '~2-3 minutes',
      parsing: '~3-4 minutes',
      saving: '~30 seconds'
    };
    
    return timeEstimates[stage.id] || '~1-2 minutes';
  };

  const getElapsedTime = (stage: ProcessingStage) => {
    if (!stage.startTime) return null;
    
    const start = new Date(stage.startTime);
    const end = stage.endTime ? new Date(stage.endTime) : new Date();
    const elapsed = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    if (elapsed < 60) return `${elapsed}s`;
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}m ${seconds}s`;
  };

  const getRetryOptions = (stage: ProcessingStage) => {
    const retryStrategies: Record<string, Array<{label: string; value: string}>> = {
      extraction: [
        { label: 'Try alternate method', value: 'alternate_method' },
        { label: 'Retry original', value: 'retry' }
      ],
      parsing: [
        { label: 'Retry with simplified prompt', value: 'simplified' },
        { label: 'Retry original', value: 'retry' }
      ],
      default: [{ label: 'Retry', value: 'retry' }]
    };
    
    return retryStrategies[stage.id] || retryStrategies.default;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Processing: {fileName}</CardTitle>
          <Badge variant={error ? 'destructive' : 'default'}>
            {error ? 'Failed' : 'Processing'}
          </Badge>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Overall Progress</span>
            <span>{Math.round(getOverallProgress())}%</span>
          </div>
          <Progress value={getOverallProgress()} className="w-full" />
          
          {/* Processing time notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              <Info className="h-4 w-4" />
              <span>
                Processing typically takes 4-8 minutes depending on document size and complexity.
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800">Processing Failed</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                {onRetry && (
                  <div className="mt-3">
                    {/* Find the failed stage for retry options */}
                    {(() => {
                      const failedStage = stages.find(stage => stage.status === 'failed');
                      const retryOptions = failedStage ? getRetryOptions(failedStage) : [{ label: 'Retry', value: 'retry' }];
                      
                      return (
                        <div className="flex space-x-2">
                          {retryOptions.map(option => (
                            <button
                              key={option.value}
                              onClick={() => onRetry(option.value)}
                              className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className={`p-4 rounded-lg border text-center ${
                stage.status === 'in_progress' 
                  ? 'bg-blue-50 border-blue-200' 
                  : stage.status === 'completed'
                  ? 'bg-green-50 border-green-200'
                  : stage.status === 'failed'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex flex-col items-center space-y-3">
                {/* Icon and Status */}
                <div className="flex items-center space-x-2">
                  <div className="flex-shrink-0">
                    {getStageIcon(stage)}
                  </div>
                  <div className="flex-shrink-0">
                    {getStageStatus(stage)}
                  </div>
                </div>
                
                {/* Stage Title */}
                <h4 className="text-sm font-medium text-gray-900">
                  {stage.name}
                </h4>
                
                {/* Time Information */}
                <div className="text-xs space-y-1">
                  {stage.status === 'in_progress' && (
                    <div className="text-blue-600">
                      {getEstimatedTime(stage)}
                    </div>
                  )}
                  {getElapsedTime(stage) && (
                    <div className="text-gray-500">
                      ({getElapsedTime(stage)} elapsed)
                    </div>
                  )}
                </div>
                
                {/* Description */}
                <p className="text-xs text-gray-600 leading-tight">
                  {stage.description}
                </p>
                
                {/* Progress Bar */}
                {stage.status === 'in_progress' && stage.progress !== undefined && (
                  <div className="w-full">
                    <Progress value={stage.progress} className="h-1.5" />
                  </div>
                )}
                
                {/* Details */}
                {stage.details && (
                  <p className="text-xs text-gray-500 leading-tight">
                    {stage.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {!error && stages.every(stage => stage.status === 'completed') && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="text-sm font-medium text-green-800">
                  Processing Complete!
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  Document has been successfully processed and parsed.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}