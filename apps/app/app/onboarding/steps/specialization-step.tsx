'use client';

import { useState } from 'react';
import { Label } from '@repo/design-system/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { OnboardingNavigation } from '../components/onboarding-navigation';
import { OnboardingData } from '../page';
import { Target, Building2, Users, Briefcase } from 'lucide-react';

interface SpecializationStepProps {
  data: Partial<OnboardingData>;
  onContinue: () => void;
  onBack: () => void;
  onUpdateData: (data: Partial<OnboardingData>) => void;
}

const LINES_OF_BUSINESS = [
  { id: 'health', label: 'Health Benefits', description: 'Medical, dental, vision insurance' },
  { id: 'life', label: 'Life Insurance', description: 'Term and permanent life insurance' },
  { id: 'disability', label: 'Disability Insurance', description: 'Short-term and long-term disability' },
  { id: 'retirement', label: 'Retirement Plans', description: '401(k), 403(b), pension plans' },
  { id: 'supplemental', label: 'Supplemental Benefits', description: 'Critical illness, accident, hospital indemnity' },
  { id: 'voluntary', label: 'Voluntary Benefits', description: 'Employee-paid benefits programs' },
  { id: 'compliance', label: 'Compliance & Administration', description: 'ACA, COBRA, HIPAA compliance' },
  { id: 'property', label: 'Property & Casualty', description: 'Business insurance, workers comp' }
];

const CLIENT_INDUSTRIES = [
  { id: 'healthcare', label: 'Healthcare & Medical' },
  { id: 'technology', label: 'Technology & Software' },
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'retail', label: 'Retail & Consumer Goods' },
  { id: 'financial', label: 'Financial Services' },
  { id: 'education', label: 'Education' },
  { id: 'nonprofit', label: 'Nonprofit Organizations' },
  { id: 'government', label: 'Government & Public Sector' },
  { id: 'hospitality', label: 'Hospitality & Tourism' },
  { id: 'construction', label: 'Construction & Real Estate' },
  { id: 'professional', label: 'Professional Services' },
  { id: 'other', label: 'Other Industries' }
];

const CLIENT_SIZES = [
  '1-10 employees',
  '11-50 employees', 
  '51-100 employees',
  '101-500 employees',
  '501-1,000 employees',
  '1,000+ employees'
];

const INSURANCE_CARRIERS = [
  { id: 'aetna', label: 'Aetna' },
  { id: 'anthem', label: 'Anthem' },
  { id: 'bluecross', label: 'Blue Cross Blue Shield' },
  { id: 'cigna', label: 'Cigna' },
  { id: 'humana', label: 'Humana' },
  { id: 'kaiser', label: 'Kaiser Permanente' },
  { id: 'unitedhealth', label: 'UnitedHealth Group' },
  { id: 'guardian', label: 'Guardian Life' },
  { id: 'principal', label: 'Principal Financial' },
  { id: 'metlife', label: 'MetLife' },
  { id: 'lincoln', label: 'Lincoln Financial' },
  { id: 'mutual', label: 'Mutual of Omaha' },
  { id: 'other', label: 'Other Carriers' }
];

export function SpecializationStep({ 
  data, 
  onContinue, 
  onBack, 
  onUpdateData 
}: SpecializationStepProps) {
  const [formData, setFormData] = useState({
    linesOfBusiness: data.linesOfBusiness || [],
    clientIndustries: data.clientIndustries || [],
    averageClientSize: data.averageClientSize || '',
    preferredCarriers: data.preferredCarriers || []
  });

  const handleCheckboxChange = (
    field: 'linesOfBusiness' | 'clientIndustries' | 'preferredCarriers',
    value: string,
    checked: boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContinue = () => {
    onUpdateData(formData);
    onContinue();
  };

  // At least one line of business should be selected
  const isFormValid = formData.linesOfBusiness.length > 0;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Specialization & Focus
        </h2>
        <p className="text-gray-600">
          Help us understand your business focus so we can customize your 
          experience and provide relevant insights.
        </p>
      </div>

      <div className="space-y-8">
        {/* Lines of Business */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Primary Lines of Business *
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Select all that apply to your business
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {LINES_OF_BUSINESS.map((line) => (
                <div key={line.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={`line-${line.id}`}
                    checked={formData.linesOfBusiness.includes(line.id)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange('linesOfBusiness', line.id, !!checked)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor={`line-${line.id}`}
                      className="text-sm font-medium text-gray-900 cursor-pointer block"
                    >
                      {line.label}
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      {line.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Client Industries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Client Industry Specializations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Which industries do you primarily serve?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {CLIENT_INDUSTRIES.map((industry) => (
                <div key={industry.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`industry-${industry.id}`}
                    checked={formData.clientIndustries.includes(industry.id)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange('clientIndustries', industry.id, !!checked)
                    }
                  />
                  <Label 
                    htmlFor={`industry-${industry.id}`}
                    className="text-sm text-gray-900 cursor-pointer"
                  >
                    {industry.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Average Client Size */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Average Client Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              What's the typical size of your client organizations?
            </p>
            <Select
              value={formData.averageClientSize}
              onValueChange={(value) => handleSelectChange('averageClientSize', value)}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Select average client size" />
              </SelectTrigger>
              <SelectContent>
                {CLIENT_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Preferred Carriers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Preferred Insurance Carriers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Which carriers do you work with most frequently?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {INSURANCE_CARRIERS.map((carrier) => (
                <div key={carrier.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`carrier-${carrier.id}`}
                    checked={formData.preferredCarriers.includes(carrier.id)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange('preferredCarriers', carrier.id, !!checked)
                    }
                  />
                  <Label 
                    htmlFor={`carrier-${carrier.id}`}
                    className="text-sm text-gray-900 cursor-pointer"
                  >
                    {carrier.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <OnboardingNavigation
        canGoBack={true}
        canContinue={isFormValid}
        onBack={onBack}
        onContinue={handleContinue}
      />
    </div>
  );
}