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
  Loader2
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
  onRetry?: () => void;
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
      upload: '~5 seconds',
      extraction: '~30 seconds',
      parsing: '~45 seconds',
      saving: '~10 seconds'
    };
    
    return timeEstimates[stage.id] || '~15 seconds';
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
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Overall Progress</span>
            <span>{Math.round(getOverallProgress())}%</span>
          </div>
          <Progress value={getOverallProgress()} className="w-full" />
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
                  <button
                    onClick={onRetry}
                    className="text-sm text-red-800 underline hover:no-underline mt-2"
                  >
                    Try again
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className={`flex items-center space-x-4 p-3 rounded-lg border ${
                stage.status === 'in_progress' 
                  ? 'bg-blue-50 border-blue-200' 
                  : stage.status === 'completed'
                  ? 'bg-green-50 border-green-200'
                  : stage.status === 'failed'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex-shrink-0">
                {getStageStatus(stage)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    {stage.name}
                  </h4>
                  {stage.status === 'in_progress' && (
                    <span className="text-xs text-blue-600">
                      {getEstimatedTime(stage)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {stage.description}
                </p>
                
                {stage.status === 'in_progress' && stage.progress !== undefined && (
                  <div className="mt-2">
                    <Progress value={stage.progress} className="h-2" />
                  </div>
                )}
                
                {stage.details && (
                  <p className="text-xs text-gray-500 mt-1">
                    {stage.details}
                  </p>
                )}
              </div>
              
              <div className="flex-shrink-0">
                {getStageIcon(stage)}
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