'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import the form component but don't use it directly
import { QuestionnaireForm as StaticQuestionnaireForm } from './questionnaire-form';
import type { FormFieldConfig, FormValues } from '@/lib/types/enrolment';

// Dynamically import the form with SSR disabled to prevent hydration issues
const DynamicQuestionnaireForm = dynamic(
  () => Promise.resolve(StaticQuestionnaireForm),
  { ssr: false }
);

interface FormWrapperProps {
  fields: FormFieldConfig<any>[];
  onFormSubmit: (data: FormValues) => void;
  isLoading: boolean;
  initialData?: Partial<FormValues>;
}

/**
 * FormWrapper component that prevents hydration mismatches by:
 * 1. Only rendering the form on the client side
 * 2. Using a loading state to avoid server/client differences
 * 3. Completely avoiding SSR for form inputs that might be affected by browser extensions
 */
export function FormWrapper(props: FormWrapperProps) {
  // Client-side only state to track if we're mounted
  const [isMounted, setIsMounted] = useState(false);

  // Only render on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show a simple loading skeleton during SSR and before client hydration
  if (!isMounted) {
    return (
      <div className="w-full shadow-xl rounded-lg border border-border p-6 animate-pulse">
        <div className="h-8 w-3/4 bg-muted rounded mb-4"></div>
        <div className="h-4 w-1/2 bg-muted rounded mb-6"></div>
        <div className="h-2 w-full bg-muted rounded mb-8"></div>
        <div className="space-y-4">
          <div className="h-12 w-full bg-muted rounded"></div>
          <div className="h-12 w-full bg-muted rounded"></div>
          <div className="h-12 w-full bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // Only render the actual form on the client side
  return <DynamicQuestionnaireForm {...props} />;
}
