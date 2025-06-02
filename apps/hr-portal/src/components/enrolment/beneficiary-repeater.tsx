'use client';

import { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus } from 'lucide-react';

interface BeneficiaryRepeaterProps {
  name: string;
  maxItems?: number;
}

export function BeneficiaryRepeater({ name, maxItems = 3 }: BeneficiaryRepeaterProps) {
  // Safely access form context with error handling
  const formContext = useFormContext();
  
  // If form context isn't available, return a placeholder
  if (!formContext) {
    console.error('BeneficiaryRepeater must be used within a FormProvider');
    return <div>Form context not available</div>;
  }
  
  const { control, register, setValue, getValues, formState: { errors } } = formContext;
  // Define an interface for the beneficiary field
  interface BeneficiaryField {
    id: string;
    relationship?: string;
    name?: string;
    percentage?: string;
    dateOfBirth?: string;
  }
  
  // Define the expected field structure
  type BeneficiaryFieldValues = {
    relationship: string;
    name: string;
    percentage: string;
    dateOfBirth: string;
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const addBeneficiary = () => {
    if (fields.length < maxItems) {
      append({
        relationship: '',
        name: '',
        percentage: '',
        dateOfBirth: ''
      });
    }
  };

  // Calculate total percentage allocated to beneficiaries
  const totalPercentage = fields.reduce((sum, field: Record<string, any>) => {
    const percentage = parseFloat(field.percentage || '0');
    return isNaN(percentage) ? sum : sum + percentage;
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Beneficiaries</h3>
          <p className="text-sm text-muted-foreground mt-1">Designate who will receive your benefits</p>
        </div>
        {fields.length < maxItems && (
          <Button 
            type="button" 
            onClick={addBeneficiary} 
            size="sm" 
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Beneficiary
          </Button>
        )}
      </div>
      
      {/* Show percentage allocation total */}
      <div className={`text-sm px-3 py-2 rounded-md ${totalPercentage === 100 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
        <p className="flex items-center">
          {totalPercentage === 100 ? (
            <>
              ✓ Total allocation: <span className="font-bold ml-1">{totalPercentage}%</span>
            </>
          ) : (
            <>
              ⚠️ Total allocation: <span className="font-bold ml-1">{totalPercentage}%</span> (should be 100%)
            </>
          )}
        </p>
      </div>

      {fields.length > 0 ? (
        <div className="space-y-4">
          {fields.map((field: Record<string, any>, index) => (
            <Card key={field.id} className="border border-gray-200">
              <CardHeader className="pb-3 pt-4 px-4 flex flex-row justify-between items-center space-y-0">
                <CardTitle className="text-base font-medium">Beneficiary {index + 1}</CardTitle>
                <Button 
                  type="button" 
                  onClick={() => remove(index)} 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 px-4 pt-0 pb-4">
              <div className="space-y-2">
                  <Label htmlFor={`${name}.${index}.relationship`}>Relationship to Member</Label>
                  <Select
                    onValueChange={(value) => {
                      setValue(`${name}.${index}.relationship`, value);
                      
                      // If Spouse is selected, auto-fill from spouse information
                      if (value === 'Spouse') {
                        const formValues = getValues();
                        const spouseFirstName = formValues.spouseFirstName;
                        const spouseLastName = formValues.spouseLastName;
                        const spouseBirthday = formValues.spouseDateOfBirth;
                        
                        if (spouseFirstName && spouseLastName) {
                          setValue(`${name}.${index}.name`, `${spouseFirstName} ${spouseLastName}`);
                        }
                        
                        if (spouseBirthday) {
                          setValue(`${name}.${index}.dateOfBirth`, spouseBirthday);
                        }
                        
                        console.log('Auto-filled spouse information', { spouseFirstName, spouseLastName, spouseBirthday });
                      }
                    }}
                    defaultValue={field.relationship}>
                    <SelectTrigger className="w-full" id={`${name}.${index}.relationship`}>
                      <SelectValue placeholder="Select a relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder">Select...</SelectItem>
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="Child">Child</SelectItem>
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>                
                <div className="space-y-2">
                  <Label htmlFor={`${name}.${index}.name`}>Full Name</Label>
                  <Input
                    id={`${name}.${index}.name`}
                    {...register(`${name}.${index}.name` as const)}
                    placeholder="e.g., Jane Doe"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${name}.${index}.percentage`}>Percentage of Benefit</Label>
                  <Input
                    id={`${name}.${index}.percentage`}
                    {...register(`${name}.${index}.percentage` as const)}
                    type="number"
                    placeholder="e.g., 50 (must total 100%)"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${name}.${index}.dateOfBirth`}>Date of Birth</Label>
                  <Input
                    id={`${name}.${index}.dateOfBirth`}
                    {...register(`${name}.${index}.dateOfBirth` as const)}
                    type="date"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Required for beneficiaries under 18</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed rounded-md flex flex-col items-center gap-4">
          <div className="text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
          </div>
          <div>
            <p className="text-gray-500 mb-1">No beneficiaries added yet</p>
            <p className="text-sm text-muted-foreground">Click the button below to add your first beneficiary</p>
          </div>
          <Button 
            type="button" 
            onClick={addBeneficiary} 
            size="sm" 
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add First Beneficiary
          </Button>
        </div>
      )}
    </div>
  );
}
