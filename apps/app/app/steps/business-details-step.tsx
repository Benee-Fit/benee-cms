import type { OnboardingData } from '../onboarding/page';
import { Button } from '@repo/design-system/components/ui/button';

interface BusinessDetailsStepProps {
  data: Partial<OnboardingData>;
  onComplete: () => void;
  onPrevious: () => void;
  onUpdateData: (data: Partial<OnboardingData>) => void;
  buttonText: string;
  loading?: boolean;
}

const LINES_OF_BUSINESS = [
  { id: 'health', label: 'Health Insurance' },
  { id: 'dental', label: 'Dental Insurance' },
  { id: 'vision', label: 'Vision Insurance' },
  { id: 'life', label: 'Life Insurance' },
  { id: 'disability', label: 'Disability Insurance' },
  { id: 'retirement', label: 'Retirement Benefits' },
  { id: 'wellness', label: 'Wellness Programs' }
];

const PREFERRED_CARRIERS = [
  { id: 'aetna', label: 'Aetna' },
  { id: 'bluecross', label: 'Blue Cross Blue Shield' },
  { id: 'cigna', label: 'Cigna' },
  { id: 'humana', label: 'Humana' },
  { id: 'unitedhealth', label: 'UnitedHealthcare' },
  { id: 'kaiser', label: 'Kaiser Permanente' },
  { id: 'metlife', label: 'MetLife' },
  { id: 'guardian', label: 'Guardian' },
  { id: 'principal', label: 'Principal' }
];

export function BusinessDetailsStep({
  data,
  onComplete,
  onPrevious,
  onUpdateData,
  buttonText,
  loading = false
}: BusinessDetailsStepProps) {
  const handleLinesOfBusinessChange = (selected: string[]) => {
    onUpdateData({ linesOfBusiness: selected });
  };

  const handlePreferredCarriersChange = (selected: string[]) => {
    onUpdateData({ preferredCarriers: selected });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Business Details</h2>
        <p className="text-sm text-gray-500">Tell us about your business focus</p>
      </div>

      <div className="space-y-4">
        <div>
          <fieldset>
            <legend className="block text-sm font-medium mb-2">
              What insurance products do you specialize in?
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {LINES_OF_BUSINESS.map((item) => (
                <label key={item.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    value={item.id}
                    checked={(data.linesOfBusiness || []).includes(item.id)}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      const currentValues = [...(data.linesOfBusiness || [])];
                      if (isChecked && !currentValues.includes(item.id)) {
                        handleLinesOfBusinessChange([...currentValues, item.id]);
                      } else if (!isChecked) {
                        handleLinesOfBusinessChange(currentValues.filter(v => v !== item.id));
                      }
                    }}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div>
          <fieldset>
            <legend className="block text-sm font-medium mb-2">
              Which carriers do you prefer to work with?
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {PREFERRED_CARRIERS.map((item) => (
                <label key={item.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    value={item.id}
                    checked={(data.preferredCarriers || []).includes(item.id)}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      const currentValues = [...(data.preferredCarriers || [])];
                      if (isChecked && !currentValues.includes(item.id)) {
                        handlePreferredCarriersChange([...currentValues, item.id]);
                      } else if (!isChecked) {
                        handlePreferredCarriersChange(currentValues.filter(v => v !== item.id));
                      }
                    }}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button onClick={onPrevious} variant="outline" disabled={loading}>
          Back
        </Button>
        <Button onClick={onComplete} disabled={loading}>
          {loading ? 'Saving...' : buttonText}
        </Button>
      </div>
    </div>
  );
}
