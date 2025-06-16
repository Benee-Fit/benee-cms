import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/design-system/components/ui/dialog';
import { VisuallyHidden } from '@repo/design-system/components/ui/visually-hidden';
import { Progress } from '@repo/design-system/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

import ClientTypeStep from './steps/ClientTypeStep';
import CompanyDetailsStep from './steps/CompanyDetailsStep';
import JointCaseStep from './steps/JointCaseStep';
import OpportunityTypeStep from './steps/OpportunityTypeStep';
import QuoteOriginStep from './steps/QuoteOriginStep';

import type {
  QuoteQuestionnaireData,
  QuoteQuestionnaireModalProps,
} from './types';
import { isQuestionnaireComplete, validateStep } from './utils/validation';

const STORAGE_KEY = 'quoteQuestionnaireData';

const initialData: QuoteQuestionnaireData = {
  clientType: null,
  opportunityType: null,
  companyName: '',
  planManagementFee: null,
  isJointCase: null,
  brokerSplits: [],
  quoteRequestOrigin: null,
  quoteRequestOriginSubcategory: null,
};

const steps = [
  { id: 1, title: 'Client Type', description: '' },
  { id: 2, title: 'Opportunity', description: '' },
  { id: 3, title: 'Company Details', description: '' },
  { id: 4, title: 'Joint Case', description: '' },
  { id: 5, title: 'Source', description: '' },
];

export default function QuoteQuestionnaireModal({
  isOpen,
  onClose,
  onComplete,
  isProcessingComplete,
  processingError,
}: QuoteQuestionnaireModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<QuoteQuestionnaireData>(initialData);
  const [isWaitingForProcessing, setIsWaitingForProcessing] = useState(false);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState<number | null>(null);

  // Load saved data on mount
  useEffect(() => {
    if (isOpen) {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setData({ ...initialData, ...parsedData });
        } catch (e) {
          // Failed to parse saved questionnaire data - reset to initial state
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
      // Questionnaire complete but still processing - start countdown
      setIsWaitingForProcessing(true);
      setAutoCloseCountdown(5);
    }
  }, [data, isProcessingComplete]);

  // Auto-close countdown timer
  useEffect(() => {
    if (autoCloseCountdown === null) return;

    if (autoCloseCountdown === 0) {
      // Close modal and scroll to processing status
      onClose();
      setAutoCloseCountdown(null);
      
      // Scroll to processing status after a brief delay to ensure modal is closed
      setTimeout(() => {
        const processingElement = document.querySelector('[data-processing-status]');
        if (processingElement) {
          processingElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
      return;
    }

    const timer = setTimeout(() => {
      setAutoCloseCountdown(autoCloseCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoCloseCountdown, onClose]);

  const handleComplete = () => {
    const completedData = { ...data, completedAt: new Date().toISOString() };
    onComplete(completedData);
    localStorage.removeItem(STORAGE_KEY); // Clear saved data after completion
  };

  const updateData = (updates: Partial<QuoteQuestionnaireData>) => {
    setData((prev) => ({ ...prev, ...updates }));
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
      setAutoCloseCountdown(null); // Cancel auto-close when navigating back
    }
  };

  const handleStepClick = (step: number) => {
    // Allow navigation to any previous step or current step
    if (step <= currentStep) {
      setCurrentStep(step);
      setIsWaitingForProcessing(false);
      setAutoCloseCountdown(null); // Cancel auto-close when navigating back
    }
  };

  const handleClose = () => {
    // Save current state before closing
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setAutoCloseCountdown(null); // Cancel auto-close when manually closing
    onClose();
  };

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;
  const completedSteps = steps.filter((step) =>
    isStepCompleted(step.id)
  ).length;

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
          
          {/* Auto-close countdown */}
          {autoCloseCountdown !== null && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto mb-4">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-700">
                  Closing in {autoCloseCountdown} second{autoCloseCountdown !== 1 ? 's' : ''}...
                </p>
              </div>
              <p className="text-xs text-green-600 mt-1">
                We'll scroll you to the processing status to track progress.
              </p>
            </div>
          )}
          
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
                Your responses have been saved. The system will proceed
                automatically when processing completes.
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
            onPlanManagementFeeChange={(value) =>
              updateData({ planManagementFee: value })
            }
          />
        );
      case 4:
        return (
          <JointCaseStep
            isJointCase={data.isJointCase}
            brokerSplits={data.brokerSplits}
            onIsJointCaseChange={(value) => updateData({ isJointCase: value })}
            onBrokerSplitsChange={(splits) =>
              updateData({ brokerSplits: splits })
            }
          />
        );
      case 5:
        return (
          <QuoteOriginStep
            value={data.quoteRequestOrigin}
            onChange={(value) => updateData({ quoteRequestOrigin: value })}
            subValue={data.quoteRequestOriginSubcategory}
            onSubValueChange={(value) => updateData({ quoteRequestOriginSubcategory: value })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-[85vw] max-h-[85vh] flex flex-col">
        {/* Visually hidden title for accessibility */}
        <VisuallyHidden>
          <DialogTitle>
            Quote Questionnaire - Question {currentStep} of {steps.length}: {steps[currentStep - 1]?.title}
          </DialogTitle>
        </VisuallyHidden>

        {/* Simplified header with just question counter */}
        <div className="flex-shrink-0 pb-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-gray-900">
              Question {currentStep} of {steps.length}
            </div>
            <Badge variant="outline" className="text-sm">
              {completedSteps}/{steps.length} completed
            </Badge>
          </div>
        </div>

        {/* Simplified Progress Bar */}
        <div className="flex-shrink-0 pb-4">
          <Progress value={progress} className="w-full h-2" />
        </div>

        {/* Improved Step Indicators */}
        <div className="flex-shrink-0 pb-6 border-b">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                {/* Step Circle and Label */}
                <div
                  className={`flex flex-col items-center cursor-pointer transition-all duration-200 px-2 ${
                    step.id <= currentStep ? 'hover:scale-105' : 'opacity-50'
                  }`}
                  onClick={() => handleStepClick(step.id)}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors mb-2 ${
                      isStepCompleted(step.id)
                        ? 'bg-green-500 border-green-500 text-white'
                        : step.id === currentStep
                          ? 'border-blue-500 text-blue-500 bg-blue-50'
                          : 'border-gray-300 text-gray-400'
                    }`}
                  >
                    {isStepCompleted(step.id) ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-semibold">{step.id}</span>
                    )}
                  </div>
                  <div
                    className={`text-xs font-medium text-center max-w-[80px] leading-tight ${
                      step.id === currentStep ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    {step.title}
                  </div>
                </div>
                
                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div 
                    className={`flex-1 h-0.5 min-w-[40px] max-w-[60px] mx-2 ${
                      isStepCompleted(step.id) ? 'bg-green-300' : 'bg-gray-200'
                    }`} 
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-6 min-h-0">{renderCurrentStep()}</div>

        {/* Navigation */}
        {!isWaitingForProcessing && (
          <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t">
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
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
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
