'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OnboardingNavigationProps {
  canGoBack: boolean;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
  isFinalStep?: boolean;
  onComplete?: () => void;
  isLoading?: boolean;
}

export function OnboardingNavigation({
  canGoBack,
  canContinue,
  onBack,
  onContinue,
  isFinalStep = false,
  onComplete,
  isLoading = false
}: OnboardingNavigationProps) {
  const handlePrimaryAction = () => {
    if (isFinalStep && onComplete) {
      onComplete();
    } else {
      onContinue();
    }
  };

  return (
    <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-8">
      <div>
        {canGoBack && (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-3">
        <Button
          onClick={handlePrimaryAction}
          disabled={!canContinue || isLoading}
          className="flex items-center min-w-32"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            !isFinalStep && <ChevronRight className="w-4 h-4 ml-2" />
          )}
          {isFinalStep ? 'Complete Setup' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}