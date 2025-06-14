'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { useCallback, useState } from 'react';
import type { OnboardingData } from '../page';
import { Loader2 } from 'lucide-react';

interface BusinessDetailsStepProps {
  data: Partial<OnboardingData>;
  onBack: () => void;
  onComplete: () => void;
  onUpdateData: (data: Partial<OnboardingData>) => void;
  isSubmitting: boolean;
}

interface Option {
  label: string;
  value: string;
}

const linesOfBusinessOptions = [
  { label: 'Group Benefits', value: 'group_benefits' },
  { label: 'Individual Life', value: 'individual_life' },
  { label: 'Retirement Plans', value: 'retirement_plans' },
  { label: 'Health Insurance', value: 'health_insurance' },
  { label: 'Disability Insurance', value: 'disability_insurance' },
  { label: 'Critical Illness', value: 'critical_illness' },
];

const carrierOptions = [
  { label: 'Sun Life', value: 'sun_life' },
  { label: 'Manulife', value: 'manulife' },
  { label: 'Canada Life', value: 'canada_life' },
  { label: 'Blue Cross', value: 'blue_cross' },
  { label: 'Desjardins', value: 'desjardins' },
  { label: 'Empire Life', value: 'empire_life' },
  { label: 'RBC Insurance', value: 'rbc_insurance' },
  { label: 'iA Financial Group', value: 'ia_financial' },
];

// Simple checkbox group component for multiple selection
function CheckboxGroup({ options, selectedValues, onChange, label }: { 
  options: Option[], 
  selectedValues: string[], 
  onChange: (values: string[]) => void,
  label: string
}) {
  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox 
              id={option.value} 
              checked={selectedValues.includes(option.value)}
              onCheckedChange={() => toggleOption(option.value)}
            />
            <Label htmlFor={option.value} className="cursor-pointer">{option.label}</Label>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BusinessDetailsStep({ data, onBack, onComplete, onUpdateData, isSubmitting }: BusinessDetailsStepProps) {
  const [businessAddress, setBusinessAddress] = useState(data.businessAddress || {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  });
  
  const [selectedLines, setSelectedLines] = useState<string[]>(data.linesOfBusiness || []);
  const [selectedCarriers, setSelectedCarriers] = useState<string[]>(data.preferredCarriers || []);

  const handleAddressChange = useCallback((field: string, value: string) => {
    setBusinessAddress(prev => {
      const updated = { ...prev, [field]: value };
      onUpdateData({ businessAddress: updated });
      return updated;
    });
  }, [onUpdateData]);

  const handleLinesOfBusinessChange = useCallback((selected: string[]) => {
    setSelectedLines(selected);
    onUpdateData({ linesOfBusiness: selected });
  }, [onUpdateData]);

  const handleCarriersChange = useCallback((selected: string[]) => {
    setSelectedCarriers(selected);
    onUpdateData({ preferredCarriers: selected });
  }, [onUpdateData]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Business Details</h1>
        <p className="text-muted-foreground mt-2">Let's set up your business profile</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Address</CardTitle>
          <CardDescription>
            Enter your business address information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              placeholder="123 Business Ave"
              value={businessAddress?.street || ''}
              onChange={(e) => handleAddressChange('street', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="City"
                value={businessAddress?.city || ''}
                onChange={(e) => handleAddressChange('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                placeholder="State/Province"
                value={businessAddress?.state || ''}
                onChange={(e) => handleAddressChange('state', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip/Postal Code</Label>
              <Input
                id="zipCode"
                placeholder="Zip/Postal Code"
                value={businessAddress?.zipCode || ''}
                onChange={(e) => handleAddressChange('zipCode', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select
                defaultValue={businessAddress?.country || 'US'}
                onValueChange={(value) => handleAddressChange('country', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Focus</CardTitle>
          <CardDescription>
            Tell us about your business specialty
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CheckboxGroup
            options={linesOfBusinessOptions}
            selectedValues={selectedLines}
            onChange={handleLinesOfBusinessChange}
            label="Lines of Business"
          />
          
          <CheckboxGroup
            options={carrierOptions}
            selectedValues={selectedCarriers}
            onChange={handleCarriersChange}
            label="Preferred Carriers"
          />
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button onClick={onComplete} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : (
            'Complete Setup'
          )}
        </Button>
      </div>
    </div>
  );
}
