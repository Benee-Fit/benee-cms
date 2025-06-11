import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import {} from 'lucide-react';
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
  const companyNameError = validateCompanyName(companyName);
  const feeError = validatePlanManagementFee(planManagementFee);

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
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          Company Details
        </h2>
        <p className="text-gray-600 mt-2">
          Enter the company information and fee structure
        </p>
      </div>

      <div className="space-y-2">
        {/* Company Name */}
        <Card>
          <CardContent className="p-2">
            <div className="space-y-2 px-6">
              <div>
                <Label htmlFor="company-name" className="text-base font-medium">
                  Company Name *
                </Label>
                <p className="text-sm text-gray-600">
                  The name of the client company
                </p>
              </div>

              <div className="space-y-2 ">
                <Input
                  id="company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => onCompanyNameChange(e.target.value)}
                  placeholder="Enter company name"
                  className={companyNameError ? 'border-red-500' : ''}
                />
                {companyNameError && (
                  <p className="text-sm text-red-600">{companyNameError}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Management Fee */}
        <Card>
          <CardContent className="p-2">
            <div className="space-y-2 px-6">
              <div>
                <Label
                  htmlFor="management-fee"
                  className="text-base font-medium"
                >
                  Plan Management Fee *
                </Label>
                <p className="text-sm text-gray-600">
                  Percentage fee for plan management
                </p>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="management-fee"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={planManagementFee === null ? '' : planManagementFee}
                    onChange={handleFeeChange}
                    placeholder="0.0"
                    className={feeError ? 'border-red-500 pr-8' : 'pr-8'}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    %
                  </span>
                </div>
                {feeError && <p className="text-sm text-red-600">{feeError}</p>}
                <p className="text-xs text-gray-500">
                  Enter a value between 0% and 100%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
