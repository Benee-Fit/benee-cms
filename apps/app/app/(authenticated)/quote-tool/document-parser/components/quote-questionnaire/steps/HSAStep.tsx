import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import {
  RadioGroup,
  RadioGroupItem,
} from '@repo/design-system/components/ui/radio-group';
import { CheckCircle2, XCircle } from 'lucide-react';

interface HSAStepProps {
  includesHSA: boolean | null;
  hsaCarrierName: string;
  onIncludesHSAChange: (value: boolean) => void;
  onHSACarrierNameChange: (value: string) => void;
}

export default function HSAStep({
  includesHSA,
  hsaCarrierName,
  onIncludesHSAChange,
  onHSACarrierNameChange,
}: HSAStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">HSA Plans</h2>
        <p className="text-gray-600 mt-2">
          Do any plans include a HSA?
        </p>
      </div>

      <RadioGroup
        value={includesHSA === null ? '' : includesHSA ? 'yes' : 'no'}
        onValueChange={(value) => onIncludesHSAChange(value === 'yes')}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Label htmlFor="hsa-yes" className="cursor-pointer">
          <Card
            className={`cursor-pointer hover:shadow-md transition-all duration-200 border-2 h-32 ${
              includesHSA === true
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <CardContent className="p-6 h-full flex flex-col justify-center">
              <div className="flex items-center space-x-4">
                <RadioGroupItem
                  value="yes"
                  id="hsa-yes"
                  className="sr-only"
                />
                <div className="flex-shrink-0">
                  <CheckCircle2
                    className={`h-8 w-8 ${
                      includesHSA === true ? 'text-green-600' : 'text-gray-400'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-medium text-gray-900">Yes</div>
                  <p className="text-sm text-gray-600 mt-1 leading-tight">
                    Plans include HSA options
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Label>

        <Label htmlFor="hsa-no" className="cursor-pointer">
          <Card
            className={`cursor-pointer hover:shadow-md transition-all duration-200 border-2 h-32 ${
              includesHSA === false
                ? 'border-gray-500 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <CardContent className="p-6 h-full flex flex-col justify-center">
              <div className="flex items-center space-x-4">
                <RadioGroupItem value="no" id="hsa-no" className="sr-only" />
                <div className="flex-shrink-0">
                  <XCircle
                    className={`h-8 w-8 ${
                      includesHSA === false ? 'text-gray-600' : 'text-gray-400'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-medium text-gray-900">No</div>
                  <p className="text-sm text-gray-600 mt-1 leading-tight">
                    No HSA plans included
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Label>
      </RadioGroup>

      {includesHSA === true && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Label htmlFor="hsa-carrier" className="text-base font-medium">
                HSA Carrier Name *
              </Label>
              <Input
                id="hsa-carrier"
                type="text"
                value={hsaCarrierName}
                onChange={(e) => onHSACarrierNameChange(e.target.value)}
                placeholder="Enter HSA carrier name"
                className="w-full"
              />
              <p className="text-sm text-gray-600">
                Please specify which carrier provides the HSA option
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}