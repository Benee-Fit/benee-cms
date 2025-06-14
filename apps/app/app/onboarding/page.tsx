'use client';

import { useState } from 'react';
import { OrganizationStep } from './steps/organization-step';
import { BusinessDetailsStep } from '../steps/business-details-step';
import { useUser } from '@repo/auth/client';
import { useRouter } from 'next/navigation';

// Simplified onboarding data interface
export interface OnboardingData {
  // Organization Details
  website: string;
  organizationName: string;
  organizationLogo?: File;
  organizationType: string;
  companySize: string;
  
  // Business Focus
  linesOfBusiness: string[];
  preferredCarriers: string[];
}

// Reduced to just 2 steps for better UX
const TOTAL_STEPS = 2;

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({
    website: '',
    linesOfBusiness: [],
    preferredCarriers: [],
  });
  
  const [loading, setLoading] = useState(false);

  const { user } = useUser();
  const router = useRouter();

  const handleNextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleUpdateData = (stepData: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...stepData }));
  };

  const handleCompleteOnboarding = async () => {
    // Check if user exists from Clerk
    if (!user) {
      alert('Please sign in to complete onboarding');
      return;
    }

    try {
      setLoading(true);
      
      // Submit organization data through API
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: onboardingData.organizationName ?? '',
          website: onboardingData.website ?? '',
          // Address removed per user request
          specialties: onboardingData.linesOfBusiness ?? [],
          preferredCarriers: onboardingData.preferredCarriers ?? []
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create organization');
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (_) {
      alert('Error creating organization');
    } finally {
      setLoading(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <OrganizationStep
            data={onboardingData}
            onContinue={handleNextStep}
            onBack={handlePreviousStep}
            onUpdateData={handleUpdateData}
          />
        );
      case 2:
        return (
          <BusinessDetailsStep
            data={onboardingData}
            buttonText="Complete Setup"
            onComplete={handleCompleteOnboarding}
            onPrevious={handlePreviousStep}
            onUpdateData={handleUpdateData}
            loading={loading}
          />
        );
      default:
        return (
          <OrganizationStep
            data={onboardingData}
            onContinue={handleNextStep}
            onBack={handlePreviousStep}
            onUpdateData={handleUpdateData}
          />
        );
      }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      {renderCurrentStep()}
    </div>
  );
}