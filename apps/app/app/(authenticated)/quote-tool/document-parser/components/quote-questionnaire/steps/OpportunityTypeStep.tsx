import { RadioGroup, RadioGroupItem } from '@repo/design-system/components/ui/radio-group';
import { Label } from '@repo/design-system/components/ui/label';
import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { RefreshCw, TrendingUp } from 'lucide-react';

interface OpportunityTypeStepProps {
  value: 'renewal' | 'go-to-market' | null;
  onChange: (value: 'renewal' | 'go-to-market') => void;
}

export default function OpportunityTypeStep({ value, onChange }: OpportunityTypeStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Opportunity Type</h2>
        <p className="text-gray-600 mt-2">What type of opportunity is this?</p>
      </div>
      
      <RadioGroup
        value={value || ''}
        onValueChange={(newValue) => onChange(newValue as 'renewal' | 'go-to-market')}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Label htmlFor="renewal" className="cursor-pointer">
          <Card className={`cursor-pointer hover:shadow-md transition-all duration-200 border-2 ${
            value === 'renewal' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <RadioGroupItem value="renewal" id="renewal" className="sr-only" />
                <div>
                  <div className="text-lg font-medium text-gray-900">
                    Renewal
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Renewing existing coverage with current or new carrier
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Label>

        <Label htmlFor="go-to-market" className="cursor-pointer">
          <Card className={`cursor-pointer hover:shadow-md transition-all duration-200 border-2 ${
            value === 'go-to-market' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <RadioGroupItem value="go-to-market" id="go-to-market" className="sr-only" />
                <div>
                  <div className="text-lg font-medium text-gray-900">
                    Go to Market
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Shopping the market for competitive options
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