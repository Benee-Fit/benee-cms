'use client';

import { useState } from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { OnboardingNavigation } from '../components/onboarding-navigation';
import { OnboardingData } from '../page';
import { Upload, Building } from 'lucide-react';

interface OrganizationStepProps {
  data: Partial<OnboardingData>;
  onContinue: () => void;
  onBack: () => void;
  onUpdateData: (data: Partial<OnboardingData>) => void;
}

const ORGANIZATION_TYPES = [
  'Insurance Agency',
  'Benefits Consulting Firm',
  'Independent Broker',
  'Corporate Benefits Department',
  'HR Consulting Firm',
  'Other'
];

const COMPANY_SIZES = [
  '1-5 employees',
  '6-20 employees',
  '21-50 employees',
  '51-100 employees',
  '101-500 employees',
  '500+ employees'
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export function OrganizationStep({ 
  data, 
  onContinue, 
  onBack, 
  onUpdateData 
}: OrganizationStepProps) {
  const [formData, setFormData] = useState({
    organizationName: data.organizationName || '',
    organizationType: data.organizationType || '',
    companySize: data.companySize || '',
    website: data.website || '',
    businessAddress: {
      street: data.businessAddress?.street || '',
      city: data.businessAddress?.city || '',
      state: data.businessAddress?.state || '',
      zipCode: data.businessAddress?.zipCode || '',
      country: data.businessAddress?.country || 'US',
    }
  });

  const [organizationLogo, setOrganizationLogo] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.organizationName.trim()) {
      newErrors.organizationName = 'Organization name is required';
    }
    if (!formData.organizationType) {
      newErrors.organizationType = 'Organization type is required';
    }
    if (!formData.companySize) {
      newErrors.companySize = 'Company size is required';
    }
    if (!formData.businessAddress.street.trim()) {
      newErrors.street = 'Street address is required';
    }
    if (!formData.businessAddress.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.businessAddress.state) {
      newErrors.state = 'State is required';
    }
    if (!formData.businessAddress.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOrganizationLogo(file);
    }
  };

  const handleContinue = () => {
    if (validateForm()) {
      onUpdateData({
        ...formData,
        organizationLogo: organizationLogo || undefined,
      });
      onContinue();
    }
  };

  const isFormValid = formData.organizationName && formData.organizationType && 
                     formData.companySize && formData.businessAddress.street &&
                     formData.businessAddress.city && formData.businessAddress.state &&
                     formData.businessAddress.zipCode;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Organization Details
        </h2>
        <p className="text-gray-600">
          Tell us about your organization. This information helps us tailor 
          the platform to your business needs.
        </p>
      </div>

      <div className="space-y-6">
        {/* Organization Logo */}
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            {organizationLogo ? (
              <img 
                src={URL.createObjectURL(organizationLogo)} 
                alt="Logo preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <Building className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Organization Logo (Optional)
            </Label>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </Button>
              {organizationLogo && (
                <span className="text-sm text-gray-500">
                  {organizationLogo.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Organization Name */}
        <div>
          <Label htmlFor="organizationName" className="text-sm font-medium text-gray-700 mb-2 block">
            Organization Name *
          </Label>
          <Input
            id="organizationName"
            value={formData.organizationName}
            onChange={(e) => handleInputChange('organizationName', e.target.value)}
            placeholder="Enter your organization name"
            className={errors.organizationName ? 'border-red-500' : ''}
          />
          {errors.organizationName && (
            <p className="text-sm text-red-600 mt-1">{errors.organizationName}</p>
          )}
        </div>

        {/* Organization Type & Company Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Organization Type *
            </Label>
            <Select
              value={formData.organizationType}
              onValueChange={(value) => handleInputChange('organizationType', value)}
            >
              <SelectTrigger className={errors.organizationType ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select organization type" />
              </SelectTrigger>
              <SelectContent>
                {ORGANIZATION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.organizationType && (
              <p className="text-sm text-red-600 mt-1">{errors.organizationType}</p>
            )}
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Company Size *
            </Label>
            <Select
              value={formData.companySize}
              onValueChange={(value) => handleInputChange('companySize', value)}
            >
              <SelectTrigger className={errors.companySize ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.companySize && (
              <p className="text-sm text-red-600 mt-1">{errors.companySize}</p>
            )}
          </div>
        </div>

        {/* Website */}
        <div>
          <Label htmlFor="website" className="text-sm font-medium text-gray-700 mb-2 block">
            Website URL (Optional)
          </Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            placeholder="https://www.company.com"
          />
        </div>

        {/* Business Address */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Business Address *
          </Label>
          <div className="space-y-4">
            <Input
              value={formData.businessAddress.street}
              onChange={(e) => handleInputChange('businessAddress.street', e.target.value)}
              placeholder="Street address"
              className={errors.street ? 'border-red-500' : ''}
            />
            {errors.street && (
              <p className="text-sm text-red-600 mt-1">{errors.street}</p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                value={formData.businessAddress.city}
                onChange={(e) => handleInputChange('businessAddress.city', e.target.value)}
                placeholder="City"
                className={errors.city ? 'border-red-500' : ''}
              />
              <Select
                value={formData.businessAddress.state}
                onValueChange={(value) => handleInputChange('businessAddress.state', value)}
              >
                <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={formData.businessAddress.zipCode}
                onChange={(e) => handleInputChange('businessAddress.zipCode', e.target.value)}
                placeholder="ZIP Code"
                className={errors.zipCode ? 'border-red-500' : ''}
              />
            </div>
            {errors.city && <p className="text-sm text-red-600">{errors.city}</p>}
            {errors.state && <p className="text-sm text-red-600">{errors.state}</p>}
            {errors.zipCode && <p className="text-sm text-red-600">{errors.zipCode}</p>}
          </div>
        </div>
      </div>

      <OnboardingNavigation
        canGoBack={true}
        canContinue={!!isFormValid}
        onBack={onBack}
        onContinue={handleContinue}
      />
    </div>
  );
}