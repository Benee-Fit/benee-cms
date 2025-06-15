'use client';

import { useState } from 'react';
import { OrganizationStep } from './steps/organization-step';
import { useUser } from '@repo/auth/client';
import { useRouter } from 'next/navigation';

// Simplified onboarding data interface
export interface OnboardingData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  profilePhoto?: File;
  
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
  
  
  // Team Members
  teamMembers: Array<{
    email: string;
    role: string;
    permissions: string[];
  }>;
}

// Reduced to just 1 step for better UX
const TOTAL_STEPS = 1;

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    website: '',
    teamMembers: [],
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
        firstName: onboardingData.firstName,
        lastName: onboardingData.lastName,
        email: onboardingData.email,
        phone: onboardingData.phone,
        title: onboardingData.title,
        organizationName: onboardingData.organizationName,
        organizationType: onboardingData.organizationType,
        companySize: onboardingData.companySize,
        website: onboardingData.website,
        businessAddress: onboardingData.businessAddress
      });
      
      console.log('Submitting to API...');
      // Submit organization data through API
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: onboardingData.firstName ?? '',
          lastName: onboardingData.lastName ?? '',
          email: onboardingData.email ?? '',
          phone: onboardingData.phone ?? '',
          title: onboardingData.title ?? '',
          organizationName: onboardingData.organizationName ?? '',
          organizationType: onboardingData.organizationType ?? '',
          companySize: onboardingData.companySize ?? '',
          website: onboardingData.website ?? '',
          linesOfBusiness: [],
          preferredCarriers: [],
          clientIndustries: [],
          averageClientSize: '',
          teamMembers: onboardingData.teamMembers ?? [],
          businessAddress: onboardingData.businessAddress ?? {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
          }
        }),
      });

      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Organization creation failed:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          errorData,
          responseHeaders: Object.fromEntries(response.headers.entries())
        });
        
        if (response.status === 404) {
          throw new Error('API endpoint not found. Please check if the server is running correctly.');
        } else if (response.status === 401) {
          throw new Error('Authentication required. Please sign in and try again.');
        } else {
          const detailedError = errorData.error || `Failed to create organization (${response.status}: ${response.statusText})`;
          console.error('Detailed error:', detailedError);
          console.error('Error details:', errorData.details);
          console.error('Error type:', errorData.errorType);
          throw new Error(detailedError);
        }
      }

      let result;
      try {
        result = await response.json();
        console.log('Raw response data:', result);
        console.log('Response success field:', result.success);
        console.log('Response message:', result.message);
        console.log('Response organization:', result.organization);
      } catch (parseError) {
        console.error('Error parsing response JSON:', parseError);
        throw new Error('Invalid response format from server');
      }

      if (!result.success) {
        console.error('API returned success=false:', result);
        throw new Error(result.message || 'Organization creation failed');
      }

      console.log('Organization created successfully:', result);

      // Redirect to dashboard
      console.log('Redirecting to dashboard...');
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
    return (
      <OrganizationStep
        data={onboardingData}
        onContinue={handleCompleteOnboarding}
        onBack={handlePreviousStep}
        onUpdateData={handleUpdateData}
        loading={loading}
        isLastStep={true}
      />
    );
  };

  return (
    <>
      {renderCurrentStep()}
    </>
  );
}