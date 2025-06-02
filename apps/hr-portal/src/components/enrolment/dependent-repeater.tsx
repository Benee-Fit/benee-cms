'use client';

import { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus } from 'lucide-react';

interface DependentRepeaterProps {
  name: string;
  maxItems?: number;
}

export function DependentRepeater({ name, maxItems = 4 }: DependentRepeaterProps) {
  // Safely access form context with error handling
  const formContext = useFormContext();
  
  // If form context isn't available, return a placeholder
  if (!formContext) {
    console.error('DependentRepeater must be used within a FormProvider');
    return <div>Form context not available</div>;
  }
  
  const { control, register, formState: { errors } } = formContext;
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const addDependent = () => {
    if (fields.length < maxItems) {
      append({
        firstName: '',
        lastName: '',
        gender: '',
        dateOfBirth: '',
        relationship: ''
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Dependents</h3>
        {fields.length < maxItems && (
          <Button 
            type="button" 
            size="sm" 
            onClick={addDependent}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Add Dependent
          </Button>
        )}
      </div>
      
      {fields.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <p>No dependents added. Click "Add Dependent" to add one.</p>
        </div>
      )}
      
      {fields.map((field, index) => (
        <Card key={field.id} className="relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex justify-between">
              <span>Dependent {index + 1}</span>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => remove(index)}
                className="h-8 w-8 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${name}.${index}.firstName`}>First Name</Label>
              <Input
                id={`${name}.${index}.firstName`}
                placeholder="e.g., Emma"
                {...register(`${name}.${index}.firstName`)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor={`${name}.${index}.lastName`}>Last Name</Label>
              <Input
                id={`${name}.${index}.lastName`}
                placeholder="e.g., Doe"
                {...register(`${name}.${index}.lastName`)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor={`${name}.${index}.gender`}>Gender</Label>
              <Select
                onValueChange={(value) => {
                  // This is a workaround for controlled Select components with react-hook-form
                  const event = {
                    target: { name: `${name}.${index}.gender`, value }
                  };
                  register(`${name}.${index}.gender`).onChange(event);
                }}
              >
                <SelectTrigger id={`${name}.${index}.gender`}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor={`${name}.${index}.dateOfBirth`}>Date of Birth</Label>
              <Input
                id={`${name}.${index}.dateOfBirth`}
                type="date"
                {...register(`${name}.${index}.dateOfBirth`)}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`${name}.${index}.relationship`}>Relationship to Member</Label>
              <Select
                onValueChange={(value) => {
                  const event = {
                    target: { name: `${name}.${index}.relationship`, value }
                  };
                  register(`${name}.${index}.relationship`).onChange(event);
                }}
              >
                <SelectTrigger id={`${name}.${index}.relationship`}>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Child">Child</SelectItem>
                  <SelectItem value="Stepchild">Stepchild</SelectItem>
                  <SelectItem value="Adopted Child">Adopted Child</SelectItem>
                  <SelectItem value="Legal Ward">Legal Ward</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
