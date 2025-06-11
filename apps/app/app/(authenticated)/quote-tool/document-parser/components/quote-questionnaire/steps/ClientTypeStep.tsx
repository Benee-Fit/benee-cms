import { RadioGroup, RadioGroupItem } from '@repo/design-system/components/ui/radio-group';
import { Label } from '@repo/design-system/components/ui/label';
import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { Users, UserPlus } from 'lucide-react';

interface ClientTypeStepProps {
  value: 'new' | 'existing' | null;
  onChange: (value: 'new' | 'existing') => void;
}

export default function ClientTypeStep({ value, onChange }: ClientTypeStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Client Type</h2>
        <p className="text-gray-600 mt-2">Is this for a new client or an existing client?</p>
      </div>
      
      <RadioGroup
        value={value || ''}
        onValueChange={(newValue) => onChange(newValue as 'new' | 'existing')}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Label htmlFor="new-client" className="cursor-pointer">
          <Card className={`cursor-pointer hover:shadow-md transition-all duration-200 border-2 ${
            value === 'new' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <RadioGroupItem value="new" id="new-client" className="sr-only" />
                <div>
                  <div className="text-lg font-medium text-gray-900">
                    New Client
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    First time working with this company
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Label>

        <Label htmlFor="existing-client" className="cursor-pointer">
          <Card className={`cursor-pointer hover:shadow-md transition-all duration-200 border-2 ${
            value === 'existing' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <RadioGroupItem value="existing" id="existing-client" className="sr-only" />
                <div>
                  <div className="text-lg font-medium text-gray-900">
                    Existing Client
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Current client with existing coverage
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Label>
      </RadioGroup>
    </div>
  );
}