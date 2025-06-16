import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { Label } from '@repo/design-system/components/ui/label';
import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { DollarSign, TrendingUp, PhoneOutgoing, Users, Award, Calendar } from 'lucide-react';

interface QuoteOriginStepProps {
  value: 'paid-advertising' | 'organic-inbound' | 'outbound-direct' | 'referrals-partnerships' | 'authority-building' | 'events-workshops' | null;
  onChange: (value: 'paid-advertising' | 'organic-inbound' | 'outbound-direct' | 'referrals-partnerships' | 'authority-building' | 'events-workshops') => void;
}

const originOptions = [
  {
    value: 'paid-advertising' as const,
    label: 'Paid Advertising',
    description: 'From paid ads, campaigns, or sponsored content',
    icon: DollarSign,
    color: 'blue'
  },
  {
    value: 'organic-inbound' as const,
    label: 'Organic & Inbound Marketing',
    description: 'Website, SEO, content marketing, or social media',
    icon: TrendingUp,
    color: 'green'
  },
  {
    value: 'outbound-direct' as const,
    label: 'Outbound & Direct Outreach',
    description: 'Cold calls, emails, or direct sales efforts',
    icon: PhoneOutgoing,
    color: 'purple'
  },
  {
    value: 'referrals-partnerships' as const,
    label: 'Referrals & Partnerships',
    description: 'Partner referrals or client recommendations',
    icon: Users,
    color: 'orange'
  },
  {
    value: 'authority-building' as const,
    label: 'Authority Building',
    description: 'Speaking engagements, publications, or thought leadership',
    icon: Award,
    color: 'yellow'
  },
  {
    value: 'events-workshops' as const,
    label: 'Events & Workshops',
    description: 'Trade shows, conferences, or educational events',
    icon: Calendar,
    color: 'indigo'
  }
];

export default function QuoteOriginStep({ value, onChange }: QuoteOriginStepProps) {
  const selectedOption = originOptions.find(option => option.value === value);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Source of Quote</h2>
        <p className="text-gray-600 mt-2">Where did this quote request originate from?</p>
      </div>
      
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="space-y-4">
            <Label htmlFor="quote-origin" className="text-base font-medium">
              Request Origin *
            </Label>
            
            <Select
              value={value || ''}
              onValueChange={(newValue) => onChange(newValue as any)}
            >
              <SelectTrigger id="quote-origin" className="w-full">
                <SelectValue placeholder="Select the origin of this quote request" />
              </SelectTrigger>
              <SelectContent>
                {originOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-3">
                        <div className={`p-1.5 bg-${option.color}-100 rounded`}>
                          <IconComponent className={`h-4 w-4 text-${option.color}-600`} />
                        </div>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-600">{option.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            {selectedOption && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 bg-${selectedOption.color}-100 rounded-lg`}>
                    <selectedOption.icon className={`h-5 w-5 text-${selectedOption.color}-600`} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{selectedOption.label}</div>
                    <div className="text-sm text-gray-600">{selectedOption.description}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}