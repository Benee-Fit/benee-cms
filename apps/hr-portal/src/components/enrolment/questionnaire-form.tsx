'use client';

import { useState, useMemo, useEffect, useId } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { FormFieldConfig, FormValues } from '@/lib/types/enrolment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, Send, AlertCircle, User, Users, FileCheck, Briefcase } from 'lucide-react';
import { DependentRepeater } from './dependent-repeater';
import { BeneficiaryRepeater } from './beneficiary-repeater';
import { cn } from '@/lib/utils';
import { formSchema as defaultFormSchema, defaultFormValues as staticDefaultFormValues } from '@/lib/config/form-fields';

interface QuestionnaireFormProps {
  fields: FormFieldConfig<any>[];
  onFormSubmit: (data: FormValues) => void;
  isLoading: boolean;
  initialData?: Partial<FormValues>;
}

// Define the form steps/sections
const FORM_STEPS = [
  {
    id: 'personal',
    label: 'Personal Information',
    icon: <User className="h-4 w-4" />
  },
  {
    id: 'relationship',
    label: 'Dependents, Beneficiaries and Trustees',
    icon: <Users className="h-4 w-4" />
  },
  {
    id: 'coverage',
    label: 'Coverage',
    icon: <FileCheck className="h-4 w-4" />
  },
  {
    id: 'employment',
    label: 'Employment Details',
    icon: <Briefcase className="h-4 w-4" />
  }
];

// This helps suppress the hydration warning caused by browser extensions like LastPass
// Reference: https://github.com/vercel/next.js/discussions/17443
const useSupressHydrationWarning = () => {
  useEffect(() => {
    // For LastPass and other extensions that modify the DOM
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const [message] = args;
      if (typeof message === 'string' && message.includes('Hydration')) {
        return;
      }
      if (typeof message === 'string' && message.includes('Target container')) {
        return;
      }
      originalConsoleError(...args);
    };
    return () => {
      console.error = originalConsoleError;
    };
  }, []);
};

export function QuestionnaireForm({
  fields,
  onFormSubmit,
  isLoading,
  initialData = {},
}: QuestionnaireFormProps) {
  // Suppress hydration warnings from browser extensions like LastPass
  useSupressHydrationWarning();
  
  // Generate a stable ID prefix for this form instance
  const formIdPrefix = useId();
  
  const [currentStep, setCurrentStep] = useState(0);

  const formSchema = useMemo(() => {
    const schemaShape: Record<string, z.ZodTypeAny> = {};
    
    // First pass: add all fields with their base validation
    fields.forEach(field => {
      schemaShape[field.id] = field.validation;
    });
    
    // Create a base schema
    const baseSchema = z.object(schemaShape);
    
    // Add conditional validations
    return baseSchema.superRefine((data, ctx) => {
      // When coverageLevel is 'O' (opt out), alternative coverage fields are required
      if (data.coverageLevel === 'O') {
        const requiredFields = [
          'alternativePlanSponsor',
          'alternativeInsurer',
          'alternativeGroupNumber'
        ];
        
        requiredFields.forEach(fieldId => {
          if (!data[fieldId]) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'This field is required when opting out of coverage',
              path: [fieldId]
            });
          }
        });
      }
      
      // Check if there are any beneficiaries under 18 years old (minor beneficiaries)
      if (data.beneficiaries && Array.isArray(data.beneficiaries)) {
        const today = new Date();
        const hasMinorBeneficiary = data.beneficiaries.some(beneficiary => {
          if (!beneficiary?.dateOfBirth) return false;
          
          const birthDate = new Date(beneficiary.dateOfBirth);
          const age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          
          // Adjust age if birthday hasn't occurred yet this year
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            return age - 1 < 18; // Subtract 1 from age if birthday hasn't occurred yet
          }
          
          return age < 18;
        });
        
        // If there's at least one minor beneficiary and the user is not in Quebec, require trustee info
        if (hasMinorBeneficiary && data.province !== 'Quebec') {
          // First, check if haveTrustee is set to 'Yes'
          if (data.haveTrustee !== 'Yes') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'You must designate a trustee for beneficiaries under 18 years of age',
              path: ['haveTrustee']
            });
          } else {
            // If haveTrustee is 'Yes', then make sure all trustee fields are filled out
            const trusteeFields = ['trusteeName', 'trusteeAddress', 'trusteeRelationship'];
            
            trusteeFields.forEach(fieldId => {
              if (!data[fieldId]) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: 'Trustee information is required for beneficiaries under 18 years of age',
                  path: [fieldId]
                });
              }
            });
          }
        }
      }
    });
  }, [fields]);

  const defaultValues = useMemo(() => {
    const values: Record<string, any> = {};
    fields.forEach(field => {
      values[field.id] = initialData[field.id] ?? field.defaultValue;
    });
    return values;
  }, [fields, initialData]);

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onChange', // Validate as fields change to provide immediate feedback
  });

  const { control, handleSubmit, watch, setValue, formState: { errors } } = methods;

  // Watch all form values
  const formValues = watch();

  // Determine which fields should be visible based on conditional logic
  const getVisibleFields = useMemo(() => {
    // First pass: determine which fields are visible based on conditions
    const visibleFieldIds = new Set<string>();

    fields.forEach(field => {
      if (field.conditionalDisplay) {
        // Handle multiple conditions (array of conditions)
        if (Array.isArray(field.conditionalDisplay)) {
          // Track if the conditions are met
          let shouldShow = false;

          // For OR conditions, we need to check if ANY condition is true
          // Most spouse fields use OR conditions between 'Married' and 'Common-law'
          const conditions = field.conditionalDisplay;

          // First condition
          if (conditions.length > 0) {
            const firstCondition = conditions[0];
            const { field: dependentField, value } = firstCondition;
            const formValue = String(formValues[dependentField] || '');
            const conditionValue = String(value);
            shouldShow = formValue === conditionValue;
          }

          // Check remaining conditions with their operators
          for (let i = 1; i < conditions.length; i++) {
            const { field: dependentField, value, operator = 'AND' } = conditions[i];
            const prevOperator = conditions[i - 1].operator || 'AND';

            const formValue = String(formValues[dependentField] || '');
            const conditionValue = String(value);
            const isMatch = formValue === conditionValue;

            // Apply the appropriate logical operation
            if (prevOperator === 'OR') {
              shouldShow = shouldShow || isMatch;
            } else { // AND
              shouldShow = shouldShow && isMatch;
            }
          }

          if (shouldShow) {
            visibleFieldIds.add(field.id);
          }
        }
        // Handle single condition
        else {
          const { field: dependentField, value } = field.conditionalDisplay;

          // Simple string comparison
          const formValue = String(formValues[dependentField] || '');
          const conditionValue = String(value);
          const isMatch = formValue === conditionValue;

          if (isMatch) {
            visibleFieldIds.add(field.id);
          }
        }
      } else {
        // Fields without conditions are always visible
        visibleFieldIds.add(field.id);
      }
    });

    // Return only the visible fields
    return fields.filter(field => visibleFieldIds.has(field.id));
  }, [fields, formValues]);

  // Fields are now filtered based on conditional display logic

  // Define field categorization by section
  const sectionFieldPatterns = {
    personal: [
      'firstName',
      'lastName',
      'personalPhone',
      'workEmail',
      'personalEmail',
      'streetAddress',
      'city',
      'province',
      'postalCode',
      'dateOfBirth',
      'gender',
    ],
    relationship: [
      'maritalStatus',
      'cohabitationDate',
      'spouse',
      'dependents',
      'beneficiaries',
      'spouseBeneficiaryDesignation',
      'haveTrustee',
      'trustee',
    ],
    coverage: [
      'coverageChanges',
      'coverageLevel',
      //'optOutWarning',
      'dependentWaiver',
      'coverageWarning',
      'waive',
      'waiveEHC',
      'otherEHCCoverage',
      'waiveDental',
      'otherDentalCoverage',
      'alternative',
      'otherCoverage',
      'Insurer',
      'GroupNumber',
      'PlanSponsor'
    ],
    employment: [
      //'planSponsorName',
      //'personalIdNumber',
      //'memberNumber',
      'occupation',
      'datePartTimeEmployment',
      'dateFullTimeEmployment',
      'dateEligibleCoverage',
      'annualEarnings',
      'hoursPerWeek',
      'employeeClass',
      'deptDivLocation',
    ]
  };

  // Helper function to find matching pattern for a field ID
  const findMatchingPattern = (fieldId: string, patterns: string[]): { match: string; index: number } | null => {
    // First try an exact match
    const exactIndex = patterns.indexOf(fieldId);
    if (exactIndex !== -1) {
      return { match: fieldId, index: exactIndex };
    }

    // Fall back to substring match if no exact match found
    for (let i = 0; i < patterns.length; i++) {
      if (fieldId.includes(patterns[i])) {
        return { match: patterns[i], index: i };
      }
    }
    return null;
  };

  // Group fields by section and sort them according to pattern order
  const fieldsBySection = useMemo(() => {
    const result: Record<string, FormFieldConfig<any>[]> = {
      personal: [],
      relationship: [],
      coverage: [],
      employment: []
    };

    // Create maps to track field positions based on matching patterns
    const sectionFieldMaps: Record<string, Map<string, { field: FormFieldConfig<any>; matchIndex: number }[]>> = {
      personal: new Map(),
      relationship: new Map(),
      coverage: new Map(),
      employment: new Map()
    };

    // First pass: categorize fields into appropriate sections
    getVisibleFields.forEach(field => {
      // Skip section headers
      if (field.type === 'section') return;

      let assigned = false;

      // Try to match field to each section's patterns
      for (const section of Object.keys(sectionFieldPatterns)) {
        const patterns = sectionFieldPatterns[section as keyof typeof sectionFieldPatterns];
        const match = findMatchingPattern(field.id, patterns);

        if (match) {
          // If we found a match, add this field to its section's map
          if (!sectionFieldMaps[section].has(match.match)) {
            sectionFieldMaps[section].set(match.match, []);
          }

          sectionFieldMaps[section].get(match.match)!.push({
            field,
            matchIndex: match.index
          });

          assigned = true;
          break;
        }
      }

      // We no longer add unmatched fields - only fields explicitly matching patterns are displayed
    });

    // Second pass: sort and flatten the maps into arrays according to pattern order
    for (const section of Object.keys(result)) {
      const sectionMap = sectionFieldMaps[section];
      const patterns = sectionFieldPatterns[section as keyof typeof sectionFieldPatterns] || [];

      // Create an array of fields sorted by their pattern index
      const sortedFields: FormFieldConfig<any>[] = [];

      // Prepare a map to store fields by their exact ID for quick lookup
      const fieldsByExactId: Record<string, FormFieldConfig<any>> = {};

      // Populate the exact ID map
      sectionMap.forEach((fieldsArray, pattern) => {
        fieldsArray.forEach(({ field }) => {
          fieldsByExactId[field.id] = field;
        });
      });

      // Add fields in the exact order specified in patterns
      patterns.forEach((pattern) => {
        // First try to get an exact match by ID
        if (fieldsByExactId[pattern]) {
          sortedFields.push(fieldsByExactId[pattern]);
        } else {
          // Fall back to pattern matching fields
          const matchingFields = sectionMap.get(pattern);
          if (matchingFields) {
            matchingFields.forEach(({ field }) => {
              // Avoid adding duplicates (in case a field was already added by exact ID)
              if (!sortedFields.some(f => f.id === field.id)) {
                sortedFields.push(field);
              }
            });
          }
        }
      });

      result[section] = sortedFields;
    }

    return result;
  }, [getVisibleFields]);

  // State for showing validation error messages
  const [showHoursError, setShowHoursError] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);

  // Handle the intentional form submission (only for the final step)
  const onSubmitHandler: SubmitHandler<FormValues> = (data) => {
    // Only proceed with submission if we're on the last step
    if (currentStep === FORM_STEPS.length - 1) {
      // Check if hours per week is 20 or less
      const hoursPerWeek = parseFloat(data.hoursPerWeek as string || '0');
      if (!isNaN(hoursPerWeek) && hoursPerWeek <= 20) {
        // Show error message and prevent submission
        setShowHoursError(true);
        // Hide the error after 5 seconds
        setTimeout(() => setShowHoursError(false), 5000);
        return;
      }

      // Submit the form data
      onFormSubmit(data);
    } else {
      // Move to the next step if not on the last step
      setCurrentStep(currentStep + 1);
    }
  };

  // Helper to prevent form submission on Enter key press for text inputs
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  // Calculate progress percentage based on current step
  const progressPercentage = ((currentStep + 1) / FORM_STEPS.length) * 100;

  // If there are no fields, show a message
  if (fields.length === 0) {
    return (
      <Card className="w-full shadow-xl">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading form fields...</p>
        </CardContent>
      </Card>
    );
  }

  // Render the form with the multi-step layout
  return (
    <div className="space-y-4">
      <Card className="w-full shadow-xl">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmitHandler)} noValidate className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">Fill in the Details</CardTitle>
              <CardDescription>Please answer the following questions to help us generate your document.</CardDescription>
              <Progress value={progressPercentage} className="mt-2 h-2" />
              <p className="text-sm text-muted-foreground mt-1 text-center">Step {currentStep + 1} of {FORM_STEPS.length}</p>
            </CardHeader>
            <div className="px-6 pt-2">
              <h3 className="text-lg font-medium text-primary">{FORM_STEPS[currentStep].label}</h3>
              <Separator className="mt-2 mb-6" />
            </div>

            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {fieldsBySection[FORM_STEPS[currentStep].id].length > 0 ? (
                  fieldsBySection[FORM_STEPS[currentStep].id].map((field) => (
                    <div key={`${formIdPrefix}-${field.id}`} className={cn(field.wrapperClass || "", "space-y-2")}>
                      <Label htmlFor={`${formIdPrefix}-${field.id}`} className={cn(
                        "text-base font-medium",
                        field.labelVisible === false ? "sr-only" : ""
                      )}>
                        {field.label}
                      </Label>
                      <Controller
                        name={field.id}
                        control={control}
                        render={({ field: formField }) => {
                          const fieldError = errors[field.id];

                          switch (field.type) {
                            case 'checkbox':
                              return (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`${formIdPrefix}-${field.id}`}
                                    checked={!!formField.value}
                                    onChange={(e) => formField.onChange(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <label htmlFor={`${formIdPrefix}-${field.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {field.label}
                                  </label>
                                </div>
                              );

                            case 'repeater':
                              if (field.id === 'beneficiaries') {
                                return (
                                  <BeneficiaryRepeater
                                    name={field.id}
                                    maxItems={field.maxItems}
                                  />
                                );
                              } else {
                                return (
                                  <DependentRepeater
                                    name={field.id}
                                    maxItems={field.maxItems}
                                  />
                                );
                              }

                            case 'textarea':
                              return (
                                <Textarea
                                  {...formField}
                                  id={`${formIdPrefix}-${field.id}`}
                                  placeholder={field.placeholder}
                                  className={cn(fieldError ? 'border-destructive focus-visible:ring-destructive' : '', "min-h-[120px] text-base")}
                                  onKeyDown={onKeyDown}
                                  aria-invalid={!!fieldError}
                                  aria-describedby={fieldError ? `${field.id}-error` : undefined}
                                />
                              );

                            case 'select':
                              return (
                                <Select
                                  onValueChange={formField.onChange}
                                  defaultValue={formField.value as string}
                                  value={(formField.value as string) || undefined}
                                >
                                  <SelectTrigger
                                    id={`${formIdPrefix}-${field.id}`}
                                    className={cn(fieldError ? 'border-destructive focus-visible:ring-destructive' : '', "text-base w-full")}
                                    aria-invalid={!!fieldError}
                                    aria-describedby={fieldError ? `${field.id}-error` : undefined}
                                  >
                                    <SelectValue placeholder={field.placeholder || "Select an option"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {field.options?.map((option) => {
                                      // Handle both string options and object options with label/value
                                      if (typeof option === 'string') {
                                        return (
                                          <SelectItem key={`${formIdPrefix}-opt-${option}`} value={option}>
                                            {option}
                                          </SelectItem>
                                        );
                                      } else {
                                        return (
                                          <SelectItem key={`${formIdPrefix}-opt-${option.value}`} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        );
                                      }
                                    })}
                                  </SelectContent>
                                </Select>
                              );

                            case 'hidden':
                              return <div style={{ display: 'none' }} />;

                            case 'message':
                              // Render different message styles based on messageLevel
                              const messageClassName = {
                                'warning': 'bg-amber-50 border-amber-200 text-amber-800 p-4 rounded-md',
                                'error': 'bg-red-50 border-red-200 text-red-800 p-4 rounded-md',
                                'message': 'bg-blue-50 border-blue-200 text-blue-800 p-4 rounded-md'
                              }[field.messageLevel || 'message'];

                              return (
                                <div className={cn(messageClassName, 'border my-2')}>
                                  {field.label}
                                </div>
                              );

                            case 'tel':
                            case 'text':
                            case 'email':
                            case 'date':
                            case 'number':
                            default:
                              return (
                                <Input
                                  {...formField}
                                  id={`${formIdPrefix}-${field.id}`}
                                  type={field.type === 'tel' ? 'tel' : field.type}
                                  placeholder={field.placeholder}
                                  className={cn(fieldError ? 'border-destructive focus-visible:ring-destructive' : '', "text-base")}
                                  onKeyDown={onKeyDown}
                                  aria-invalid={!!fieldError}
                                  aria-describedby={fieldError ? `${field.id}-error` : undefined}
                                />
                              );
                          }
                        }}
                      />
                      {errors[field.id] && (
                        <p id={`${field.id}-error`} className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle size={16} /> {errors[field.id]?.message as string}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center py-8 w-full">
                    <p className="text-center text-muted-foreground">No fields to display in this section</p>
                  </div>
                )}

                {showHoursError && (
                  <Alert variant="destructive" className="md:col-span-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      You cannot proceed with 20 or fewer hours per week. Please update your hours to continue.
                    </AlertDescription>
                  </Alert>
                )}
                
                {showValidationError && (
                  <Alert variant="destructive" className="md:col-span-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Validation Error</AlertTitle>
                    <AlertDescription>
                      Please fix the highlighted errors before proceeding to the next step.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>

              <CardFooter className="flex justify-between items-center pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0 || isLoading}
                className="gap-1"
              >
                <ArrowLeft size={18} />
                Previous
              </Button>

              {currentStep < FORM_STEPS.length - 1 ? (
                <Button 
                  type="button" 
                  onClick={async () => {
                    // Get field IDs for the current step
                    const currentStepFields = fieldsBySection[FORM_STEPS[currentStep].id].map(field => field.id);
                    
                    // Validate all fields in the current step before proceeding
                    const isValid = await methods.trigger(currentStepFields);
                    if (isValid) {
                      setCurrentStep(Math.min(FORM_STEPS.length - 1, currentStep + 1));
                    } else {
                      console.log('Validation failed for current step');
                      setShowValidationError(true);
                      // Hide the error after 5 seconds
                      setTimeout(() => setShowValidationError(false), 5000);
                    }
                  }}
                  disabled={isLoading} 
                  className="gap-1"
                >
                  Next
                  <ArrowRight size={18} />
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={isLoading}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground gap-1"
                  onClick={async () => {
                    // Get employment fields to validate
                    const employmentFields = fieldsBySection['employment']?.map(field => field.id) || [];
                    
                    // Check for validation errors in employment fields
                    const isValid = await methods.trigger(employmentFields);
                    
                    if (!isValid) {
                      console.log('Employment fields validation failed');
                      setShowValidationError(true);
                      setTimeout(() => setShowValidationError(false), 5000);
                      return;
                    }
                    
                    // Get the form data
                    const values = methods.getValues();
                    
                    // Special check for hours per week
                    const hoursPerWeek = parseFloat(values.hoursPerWeek as string || '0');
                    if (!isNaN(hoursPerWeek) && hoursPerWeek <= 20) {
                      setShowHoursError(true);
                      setTimeout(() => setShowHoursError(false), 5000);
                      return;
                    }
                    
                    // If validation passes, submit the form
                    console.log('Form validation passed, submitting data');
                    onFormSubmit(values);
                  }}
                >
                  {isLoading ? 'Generating...' : 'Submit & Generate'}
                  <Send size={18} />
                </Button>
              )}
            </CardFooter>
          </form>
        </FormProvider>
      </Card>
    </div>
  );
}