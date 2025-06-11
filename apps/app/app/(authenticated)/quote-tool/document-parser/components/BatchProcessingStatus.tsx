'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Progress } from '@repo/design-system/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  FileText,
  AlertTriangle,
  Info
} from 'lucide-react';
import ProcessingStatus from './ProcessingStatus';

interface FileWithPreview extends File {
  preview?: string;
  category?: 'Current' | 'Renegotiated' | 'Alternative';
}

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

interface ProcessedFile {
  file: FileWithPreview;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: Record<string, unknown>;
  error?: string;
  startTime?: string;
  endTime?: string;
}

interface BatchProcessingStatusProps {
  files: FileWithPreview[];
  processingIndex: number;
  completedFiles: ProcessedFile[];
  failedFiles: ProcessedFile[];
  currentStages: ProcessingStage[];
  onRetryFile?: (fileIndex: number) => void;
  estimatedTimeRemaining?: number;
}

function DocumentStatusPill({ 
  file, 
  status, 
  index,
  onClick 
}: { 
  file: FileWithPreview; 
  status: 'pending' | 'processing' | 'completed' | 'failed';
  index: number;
  onClick?: () => void;
}) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div
      className={`flex-shrink-0 p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${getStatusColor()}`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-2 min-w-0">
        {getStatusIcon()}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate max-w-[120px]" title={file.name}>
            {file.name}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-gray-500">
              {Math.round(file.size / 1024)}KB
            </span>
            <Badge variant="outline" className="text-xs px-1 py-0">
              {file.category}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BatchProcessingStatus({
  files,
  processingIndex,
  completedFiles,
  failedFiles,
  currentStages,
  onRetryFile,
  estimatedTimeRemaining
}: BatchProcessingStatusProps) {
  const totalFiles = files.length;
  const completedCount = completedFiles.length;
  const failedCount = failedFiles.length;
  const successRate = totalFiles > 0 ? (completedCount / totalFiles) * 100 : 0;
  const overallProgress = totalFiles > 0 ? ((completedCount + failedCount) / totalFiles) * 100 : 0;

  const getFileStatus = (index: number): 'pending' | 'processing' | 'completed' | 'failed' => {
    if (completedFiles.find(f => files.indexOf(f.file) === index)) return 'completed';
    if (failedFiles.find(f => files.indexOf(f.file) === index)) return 'failed';
    if (index === processingIndex) return 'processing';
    return 'pending';
  };

  const formatTimeRemaining = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${Math.round(remainingSeconds)}s`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Processing {totalFiles} Document{totalFiles !== 1 ? 's' : ''}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
              <Badge variant="secondary" className="text-xs">
                ~{formatTimeRemaining(estimatedTimeRemaining)} remaining
              </Badge>
            )}
            <Badge variant={failedCount > 0 ? 'destructive' : 'default'}>
              {completedCount}/{totalFiles} complete
            </Badge>
          </div>
        </div>
        
        {/* Processing time notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-sm text-blue-800">
            <Info className="h-4 w-4" />
            <span>
              Processing takes 4-8 minutes per document depending on size and complexity. 
              You can fill out the questionnaire while waiting.
            </span>
          </div>
        </div>
        
        {/* Overall progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="w-full" />
          
          {/* Statistics */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span>{completedCount} completed</span>
              </span>
              {failedCount > 0 && (
                <span className="flex items-center space-x-1">
                  <XCircle className="h-3 w-3 text-red-600" />
                  <span>{failedCount} failed</span>
                </span>
              )}
              <span className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-gray-400" />
                <span>{totalFiles - completedCount - failedCount} pending</span>
              </span>
            </div>
            {successRate > 0 && (
              <span>Success rate: {Math.round(successRate)}%</span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Document queue visualization */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Document Queue</h4>
          <div className="flex space-x-3 overflow-x-auto pb-2">
            {files.map((file, index) => (
              <DocumentStatusPill 
                key={index}
                file={file}
                status={getFileStatus(index)}
                index={index}
                onClick={() => {
                  // Could implement file detail view here
                }}
              />
            ))}
          </div>
        </div>

        {/* Current document detailed status */}
        {processingIndex < files.length && currentStages.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Currently Processing: {files[processingIndex]?.name}
            </h4>
            <ProcessingStatus
              fileName={files[processingIndex]?.name || 'Unknown'}
              stages={currentStages}
              currentStage={currentStages.find(stage => stage.status === 'in_progress')?.id}
              onRetry={() => onRetryFile?.(processingIndex)}
            />
          </div>
        )}

        {/* Failed files summary */}
        {failedFiles.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800">
                  {failedFiles.length} Document{failedFiles.length !== 1 ? 's' : ''} Failed
                </h4>
                <div className="mt-2 space-y-2">
                  {failedFiles.map((failedFile, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-red-700 truncate">
                        {failedFile.file.name}
                      </span>
                      {onRetryFile && (
                        <button
                          onClick={() => onRetryFile(files.indexOf(failedFile.file))}
                          className="text-sm text-red-800 underline hover:no-underline"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completion message */}
        {completedCount === totalFiles && failedCount === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="text-sm font-medium text-green-800">
                  All Documents Processed Successfully!
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  {totalFiles} document{totalFiles !== 1 ? 's have' : ' has'} been processed and are ready for analysis.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}