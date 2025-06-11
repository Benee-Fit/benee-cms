'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Progress } from '@repo/design-system/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Zap,
  Database,
  Eye
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
  stages: ProcessingStage[];
  currentStage?: string;
}

export default function ProcessingStatus({ stages, currentStage }: ProcessingStatusProps) {
  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStageDescription = (stageId: string) => {
    const icons: Record<string, JSX.Element> = {
      authentication: <Eye className="h-3 w-3" />,
      form_validation: <FileText className="h-3 w-3" />,
      file_upload: <Database className="h-3 w-3" />,
      pdf_extraction: <FileText className="h-3 w-3" />,
      ai_processing: <Zap className="h-3 w-3" />,
      save_results: <Database className="h-3 w-3" />
    };
    
    return icons[stageId] || <Clock className="h-3 w-3" />;
  };

  const completedStages = stages.filter(stage => stage.status === 'completed').length;
  const totalStages = stages.length;
  const overallProgress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

  const hasFailedStages = stages.some(stage => stage.status === 'failed');
  const hasInProgressStages = stages.some(stage => stage.status === 'in_progress');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Processing Status</CardTitle>
          <Badge 
            className={`text-xs ${
              hasFailedStages 
                ? 'bg-red-50 text-red-700 border-red-200'
                : hasInProgressStages
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : overallProgress === 100
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-gray-50 text-gray-700 border-gray-200'
            }`}
          >
            {hasFailedStages 
              ? 'Failed'
              : hasInProgressStages
              ? 'Processing'
              : overallProgress === 100
              ? 'Completed'
              : 'Pending'
            }
          </Badge>
        </div>
        
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Overall Progress</span>
            <span>{completedStages}/{totalStages} stages</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {stages.map((stage) => (
            <div 
              key={stage.id}
              className={`flex items-start space-x-3 p-3 rounded-lg border ${
                currentStage === stage.id ? 'ring-2 ring-primary ring-opacity-20' : ''
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getStageIcon(stage.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStageDescription(stage.id)}
                    <h4 className="text-sm font-medium">{stage.name}</h4>
                  </div>
                  
                  <Badge className={`text-xs ${getStageColor(stage.status)}`}>
                    {stage.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mt-1">
                  {stage.description}
                </p>
                
                {stage.details && (
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {stage.details}
                  </p>
                )}
                
                {stage.progress !== undefined && stage.status === 'in_progress' && (
                  <div className="mt-2">
                    <Progress value={stage.progress} className="h-1" />
                  </div>
                )}
                
                {/* Timing Information */}
                {(stage.startTime || stage.endTime) && (
                  <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                    {stage.startTime && (
                      <span>Started: {new Date(stage.startTime).toLocaleTimeString()}</span>
                    )}
                    {stage.endTime && (
                      <span>Completed: {new Date(stage.endTime).toLocaleTimeString()}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Error Summary */}
        {hasFailedStages && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <h4 className="text-sm font-medium text-red-700">Processing Errors</h4>
            </div>
            <div className="mt-2 space-y-1">
              {stages
                .filter(stage => stage.status === 'failed')
                .map(stage => (
                  <p key={stage.id} className="text-xs text-red-600">
                    {stage.name}: {stage.details || 'Unknown error occurred'}
                  </p>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}