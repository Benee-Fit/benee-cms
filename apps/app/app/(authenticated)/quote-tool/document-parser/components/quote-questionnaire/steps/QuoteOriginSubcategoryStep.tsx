import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { Label } from '@repo/design-system/components/ui/label';
import { Card, CardContent } from '@repo/design-system/components/ui/card';

interface QuoteOriginSubcategoryStepProps {
  mainCategory: 'paid-advertising' | 'organic-inbound' | 'outbound-direct' | 'referrals-partnerships' | 'authority-building' | 'events-workshops' | null;
  value: string | null;
  onChange: (value: string) => void;
}

const subCategories = {
  'paid-advertising': [
    'Google Search Ads',
    'Google Display Network',
    'Facebook / Instagram Ads',
    'TikTok Ads',
    'LinkedIn Ads',
    'YouTube Ads',
    'Sponsored Podcast or Influencer Ads or events',
    'Other'
  ],
  'organic-inbound': [
    'SEO (Search Engine Optimization)',
    'Blog Content',
    'YouTube Channel (educational, product content)',
    'Podcast (hosted or guesting)',
    'Webinars (live or pre-recorded)',
    'Email Newsletters',
    'Organic Social (LinkedIn, TikTok, Instagram, etc.)',
    'Online Communities (Reddit, Slack, Quora, Facebook Groups)',
    'PR / Earned Media Mentions',
    'Guest Blogging or Publishing',
    'Other'
  ],
  'outbound-direct': [
    'Cold Email',
    'Cold Calling',
    'LinkedIn DMs',
    'Company Drop-Ins',
    'Direct Mail',
    'SMS Campaigns',
    'Other'
  ],
  'referrals-partnerships': [
    'Client Referrals',
    'Partner / Channel Referrals (e.g., financial advisors, payroll companies)',
    'Affiliate Programs',
    'Business Networking Events',
    'Alumni / Personal Network Outreach',
    'Other'
  ],
  'authority-building': [
    'Speaking Gigs / Panels',
    'Books / Whitepapers',
    'Awards / Industry Recognition',
    'Other'
  ],
  'events-workshops': [
    'Trade Shows / Industry Conferences',
    'In-person Workshops / Masterclasses',
    'Lunch & Learns (in-office or virtual)',
    'Other'
  ]
};

const categoryTitles = {
  'paid-advertising': 'Paid Advertising',
  'organic-inbound': 'Organic & Inbound Marketing',
  'outbound-direct': 'Outbound & Direct Outreach',
  'referrals-partnerships': 'Referrals & Partnerships',
  'authority-building': 'Authority Building',
  'events-workshops': 'Events & Workshops'
};

export default function QuoteOriginSubcategoryStep({ mainCategory, value, onChange }: QuoteOriginSubcategoryStepProps) {
  if (!mainCategory) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please select a source category first.</p>
      </div>
    );
  }

  const options = subCategories[mainCategory] || [];
  const categoryTitle = categoryTitles[mainCategory];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Specific {categoryTitle} Source</h2>
        <p className="text-gray-600 mt-2">Select the specific channel or method</p>
      </div>
      
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="space-y-4">
            <Label htmlFor="quote-subcategory" className="text-base font-medium">
              Specific Source *
            </Label>
            
            <Select
              value={value || ''}
              onValueChange={onChange}
            >
              <SelectTrigger id="quote-subcategory" className="w-full">
                <SelectValue placeholder={`Select specific ${categoryTitle.toLowerCase()} source`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {value && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Selected: </span>
                  <span className="text-gray-900">{value}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}