import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import {} from 'lucide-react';
import React from 'react';
import {
  validateCompanyName,
  validatePlanManagementFee,
} from '../utils/validation';

interface CompanyDetailsStepProps {
  companyName: string;
  planManagementFee: number | null;
  onCompanyNameChange: (value: string) => void;
  onPlanManagementFeeChange: (value: number | null) => void;
}

export default function CompanyDetailsStep({
  companyName,
  planManagementFee,
  onCompanyNameChange,
  onPlanManagementFeeChange,
}: CompanyDetailsStepProps) {
  const [touched, setTouched] = React.useState({
    companyName: false,
    planManagementFee: false,
  });

  const companyNameError = touched.companyName ? validateCompanyName(companyName) : null;
  const feeError = touched.planManagementFee ? validatePlanManagementFee(planManagementFee) : null;

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onPlanManagementFeeChange(null);
    } else {
      const numValue = Number.parseFloat(value);
      if (!isNaN(numValue)) {
        onPlanManagementFeeChange(numValue);
      }
    }
  };

  return (
    <div className="space-y-2">
        {/* Company Name */}
        <Card>
          <CardContent className="p-3">
            <div className="space-y-2">
              <Label htmlFor="company-name" className="text-sm font-medium">
                Company Name * 
                <span className="text-xs text-gray-500 font-normal ml-1">The name of the client company</span>
              </Label>
              <Input
                id="company-name"
                type="text"
                value={companyName}
                onChange={(e) => onCompanyNameChange(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, companyName: true }))}
                placeholder="Enter company name"
                className={companyNameError ? 'border-red-500' : ''}
              />
              {companyNameError && (
                <p className="text-xs text-red-600">{companyNameError}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plan Management Fee */}
        <Card>
          <CardContent className="p-3">
            <div className="space-y-2">
              <Label htmlFor="management-fee" className="text-sm font-medium">
                Plan Management Fee * 
                <span className="text-xs text-gray-500 font-normal ml-1">Percentage fee for plan management (0-15%)</span>
              </Label>
              <div className="relative">
                <Input
                  id="management-fee"
                  type="number"
                  min="0"
                  max="15"
                  step="0.1"
                  value={planManagementFee === null ? '' : planManagementFee}
                  onChange={handleFeeChange}
                  onBlur={() => setTouched(prev => ({ ...prev, planManagementFee: true }))}
                  placeholder="0.0"
                  className={feeError ? 'border-red-500 pr-8' : 'pr-8'}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  %
                </span>
              </div>
              {feeError && <p className="text-xs text-red-600">{feeError}</p>}
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
