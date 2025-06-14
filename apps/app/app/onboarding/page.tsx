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
  
  // Business Address
  businessAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
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
    businessAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
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
    console.log('Current user:', user);
    if (!user) {
      alert('Please sign in to complete onboarding. Redirecting to sign-in page...');
      // Redirect to sign-in page if user is not authenticated
      window.location.href = '/sign-in';
      return;
    }

    try {
      setLoading(true);
      console.log('Submitting organization data:', {
        organizationName: onboardingData.organizationName,
        organizationType: onboardingData.organizationType,
        companySize: onboardingData.companySize,
        website: onboardingData.website,
        linesOfBusiness: onboardingData.linesOfBusiness,
        preferredCarriers: onboardingData.preferredCarriers,
        businessAddress: onboardingData.businessAddress
      });
      
      // Submit organization data through API
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationName: onboardingData.organizationName ?? '',
          organizationType: onboardingData.organizationType ?? '',
          companySize: onboardingData.companySize ?? '',
          website: onboardingData.website ?? '',
          linesOfBusiness: onboardingData.linesOfBusiness ?? [],
          preferredCarriers: onboardingData.preferredCarriers ?? [],
          businessAddress: onboardingData.businessAddress ?? {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Organization creation failed:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          errorData
        });
        
        if (response.status === 404) {
          throw new Error('API endpoint not found. Please check if the server is running correctly.');
        } else if (response.status === 401) {
          throw new Error('Authentication required. Please sign in and try again.');
        } else {
          throw new Error(errorData.error || `Failed to create organization (${response.status}: ${response.statusText})`);
        }
      }

      const result = await response.json();
      console.log('Organization created successfully:', result);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error creating organization: ${errorMessage}`);
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