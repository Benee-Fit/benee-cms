import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/design-system/components/ui/dialog';
import { Button } from '@repo/design-system/components/ui/button';
import { Progress } from '@repo/design-system/components/ui/progress';
import { Badge } from '@repo/design-system/components/ui/badge';
import { CheckCircle, Clock, ArrowLeft, ArrowRight } from 'lucide-react';

import ClientTypeStep from './steps/ClientTypeStep';
import OpportunityTypeStep from './steps/OpportunityTypeStep';
import CompanyDetailsStep from './steps/CompanyDetailsStep';
import JointCaseStep from './steps/JointCaseStep';
import QuoteOriginStep from './steps/QuoteOriginStep';

import type { QuoteQuestionnaireData, QuoteQuestionnaireModalProps } from './types';
import { validateStep, isQuestionnaireComplete } from './utils/validation';

const STORAGE_KEY = 'quoteQuestionnaireData';

const initialData: QuoteQuestionnaireData = {
  clientType: null,
  opportunityType: null,
  companyName: '',
  planManagementFee: null,
  isJointCase: null,
  brokerSplits: [],
  quoteRequestOrigin: null,
};

const steps = [
  { id: 1, title: 'Client Type', description: 'New or existing client' },
  { id: 2, title: 'Opportunity', description: 'Renewal or go to market' },
  { id: 3, title: 'Company Details', description: 'Name and management fee' },
  { id: 4, title: 'Joint Case', description: 'Broker fee splitting' },
  { id: 5, title: 'Quote Origin', description: 'Request source' },
];

export default function QuoteQuestionnaireModal({
  isOpen,
  onClose,
  onComplete,
  isProcessingComplete,
  processingError
}: QuoteQuestionnaireModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<QuoteQuestionnaireData>(initialData);
  const [isWaitingForProcessing, setIsWaitingForProcessing] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    if (isOpen) {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setData({ ...initialData, ...parsedData });
        } catch (e) {
          console.warn('Failed to parse saved questionnaire data:', e);
        }
      }
    }
  }, [isOpen]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isOpen]);

  // Handle completion logic
  useEffect(() => {
    if (isQuestionnaireComplete(data) && isProcessingComplete) {
      // Both questionnaire and processing are complete
      handleComplete();
    } else if (isQuestionnaireComplete(data) && !isProcessingComplete) {
      // Questionnaire complete but still processing
      setIsWaitingForProcessing(true);
    }
  }, [data, isProcessingComplete]);

  const handleComplete = () => {
    const completedData = { ...data, completedAt: new Date().toISOString() };
    onComplete(completedData);
    localStorage.removeItem(STORAGE_KEY); // Clear saved data after completion
  };

  const updateData = (updates: Partial<QuoteQuestionnaireData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const isStepValid = (step: number) => validateStep(step, data);
  const isStepCompleted = (step: number) => isStepValid(step);

  const canProceedToNext = isStepValid(currentStep);
  const canGoBack = currentStep > 1;
  const isLastStep = currentStep === steps.length;

  const handleNext = () => {
    if (canProceedToNext && !isLastStep) {
      setCurrentStep(currentStep + 1);
    } else if (isLastStep && isQuestionnaireComplete(data)) {
      if (isProcessingComplete) {
        handleComplete();
      } else {
        setIsWaitingForProcessing(true);
      }
    }
  };

  const handlePrevious = () => {
    if (canGoBack) {
      setCurrentStep(currentStep - 1);
      setIsWaitingForProcessing(false);
    }
  };

  const handleStepClick = (step: number) => {
    // Allow navigation to any previous step or current step
    if (step <= currentStep) {
      setCurrentStep(step);
      setIsWaitingForProcessing(false);
    }
  };

  const handleClose = () => {
    // Save current state before closing
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    onClose();
  };

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;
  const completedSteps = steps.filter(step => isStepCompleted(step.id)).length;

  const renderCurrentStep = () => {
    if (isWaitingForProcessing) {
      return (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Clock className="h-8 w-8 text-blue-600 animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Questionnaire Complete!
          </h3>
          <p className="text-gray-600 mb-4">
            Waiting for document processing to finish...
          </p>
          {processingError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-red-600">{processingError}</p>
              <p className="text-xs text-red-500 mt-1">
                You can still proceed with the questionnaire data.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-600">
                Your responses have been saved. The system will proceed automatically when processing completes.
              </p>
            </div>
          )}
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <ClientTypeStep
            value={data.clientType}
            onChange={(value) => updateData({ clientType: value })}
          />
        );
      case 2:
        return (
          <OpportunityTypeStep
            value={data.opportunityType}
            onChange={(value) => updateData({ opportunityType: value })}
          />
        );
      case 3:
        return (
          <CompanyDetailsStep
            companyName={data.companyName}
            planManagementFee={data.planManagementFee}
            onCompanyNameChange={(value) => updateData({ companyName: value })}
            onPlanManagementFeeChange={(value) => updateData({ planManagementFee: value })}
          />
        );
      case 4:
        return (
          <JointCaseStep
            isJointCase={data.isJointCase}
            brokerSplits={data.brokerSplits}
            onIsJointCaseChange={(value) => updateData({ isJointCase: value })}
            onBrokerSplitsChange={(splits) => updateData({ brokerSplits: splits })}
          />
        );
      case 5:
        return (
          <QuoteOriginStep
            value={data.quoteRequestOrigin}
            onChange={(value) => updateData({ quoteRequestOrigin: value })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">
            Quote Information
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Please provide details while we process your documents
          </p>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-4 pb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-gray-600">
              {completedSteps} of {steps.length} completed
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between pb-6 border-b">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center space-y-2 cursor-pointer ${
                step.id <= currentStep ? '' : 'opacity-50'
              }`}
              onClick={() => handleStepClick(step.id)}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                isStepCompleted(step.id)
                  ? 'bg-green-500 border-green-500 text-white'
                  : step.id === currentStep
                  ? 'border-blue-500 text-blue-500'
                  : 'border-gray-300 text-gray-400'
              }`}>
                {isStepCompleted(step.id) ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="text-xs font-medium">{step.id}</span>
                )}
              </div>
              <div className="text-center">
                <div className={`text-xs font-medium ${
                  step.id === currentStep ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500 max-w-20 leading-tight">
                  {step.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-6">
          {renderCurrentStep()}
        </div>

        {/* Navigation */}
        {!isWaitingForProcessing && (
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={!canGoBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <div className="flex items-center space-x-2">
              {isProcessingComplete && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Processing Complete
                </Badge>
              )}
              {processingError && (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  Processing Error
                </Badge>
              )}
            </div>

            <Button
              onClick={handleNext}
              disabled={!canProceedToNext}
              className="flex items-center space-x-2"
            >
              <span>{isLastStep ? 'Complete' : 'Next'}</span>
              {!isLastStep && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}