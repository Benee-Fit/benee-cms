'use client';

import { ReactNode } from 'react';
import { OnboardingProgress } from './onboarding-progress';

interface OnboardingContainerProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
}

export function OnboardingContainer({ 
  children, 
  currentStep, 
  totalSteps 
}: OnboardingContainerProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="relative px-6 pt-8 pb-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Welcome to Benee CMS
          </h1>
          <p className="text-gray-600 mb-6">
            Let's get your organization set up in just a few steps
          </p>

          {/* Progress Indicator */}
          <OnboardingProgress currentStep={currentStep} totalSteps={totalSteps} />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          Step {currentStep} of {totalSteps} • Takes about 5-10 minutes
        </div>
      </div>
    </div>
  );
}