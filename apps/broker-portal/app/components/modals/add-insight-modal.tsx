'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/design-system/components/ui/dialog';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Textarea } from '@repo/design-system/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/design-system/components/ui/select';
import { Alert, AlertDescription } from '@repo/design-system/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

export interface InsightFormData {
  clientId: string;
  category: 'METRIC' | 'REVENUE' | 'RISK' | 'OPPORTUNITY';
  type: string;
  title: string;
  description?: string;
  value: any;
  period?: string;
  targetValue?: any;
  sortOrder?: number;
}

interface AddInsightModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InsightFormData) => Promise<void>;
  clients: Array<{ id: string; companyName: string }>;
  defaultCategory?: 'METRIC' | 'REVENUE' | 'RISK' | 'OPPORTUNITY';
  defaultClientId?: string;
}

const INSIGHT_TYPES = {
  METRIC: [
    { value: 'total_premium', label: 'Total Premium' },
    { value: 'headcount', label: 'Employee Count' },
    { value: 'premium_per_employee', label: 'Premium per Employee' },
    { value: 'avg_age', label: 'Average Age' },
    { value: 'participation_rate', label: 'Participation Rate' },
  ],
  REVENUE: [
    { value: 'annual_revenue', label: 'Annual Revenue' },
    { value: 'monthly_revenue', label: 'Monthly Revenue' },
    { value: 'revenue_per_employee', label: 'Revenue per Employee' },
    { value: 'commission_rate', label: 'Commission Rate' },
    { value: 'management_fee', label: 'Management Fee' },
  ],
  RISK: [
    { value: 'high_risk_renewal', label: 'High Risk Renewal' },
    { value: 'claims_trend', label: 'Claims Trend' },
    { value: 'loss_ratio', label: 'Loss Ratio' },
    { value: 'retention_risk', label: 'Retention Risk' },
    { value: 'pricing_pressure', label: 'Pricing Pressure' },
  ],
  OPPORTUNITY: [
    { value: 'growth_potential', label: 'Growth Potential' },
    { value: 'cross_sell', label: 'Cross-sell Opportunity' },
    { value: 'upsell', label: 'Upsell Opportunity' },
    { value: 'referral', label: 'Referral Opportunity' },
    { value: 'renewal_expansion', label: 'Renewal Expansion' },
  ],
};

const PERIODS = [
  { value: 'current', label: 'Current' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
  { value: 'ytd', label: 'Year to Date' },
];

export function AddInsightModal({
  open,
  onOpenChange,
  onSubmit,
  clients,
  defaultCategory = 'METRIC',
  defaultClientId,
}: AddInsightModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<InsightFormData>>({
    category: defaultCategory,
    clientId: defaultClientId || '',
    type: '',
    title: '',
    description: '',
    period: 'current',
    sortOrder: 1,
  });

  const [valueInput, setValueInput] = useState('');
  const [targetValueInput, setTargetValueInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.category || !formData.type || !formData.title) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Parse value based on category
      let parsedValue = {};
      let parsedTargetValue = undefined;

      try {
        if (formData.category === 'METRIC' || formData.category === 'REVENUE') {
          // Try to parse as number first, then as JSON
          if (valueInput.includes('{') || valueInput.includes('[')) {
            parsedValue = JSON.parse(valueInput);
          } else {
            const numValue = parseFloat(valueInput);
            if (!isNaN(numValue)) {
              parsedValue = { 
                amount: numValue, 
                currency: 'USD',
                ...(formData.period && { period: formData.period })
              };
            } else {
              parsedValue = { value: valueInput };
            }
          }

          if (targetValueInput) {
            if (targetValueInput.includes('{') || targetValueInput.includes('[')) {
              parsedTargetValue = JSON.parse(targetValueInput);
            } else {
              const numValue = parseFloat(targetValueInput);
              if (!isNaN(numValue)) {
                parsedTargetValue = { amount: numValue, currency: 'USD' };
              }
            }
          }
        } else {
          // For RISK and OPPORTUNITY, try JSON first
          if (valueInput.includes('{') || valueInput.includes('[')) {
            parsedValue = JSON.parse(valueInput);
          } else {
            parsedValue = { description: valueInput };
          }
        }
      } catch (parseError) {
        throw new Error('Invalid JSON format in value fields');
      }

      const submitData: InsightFormData = {
        clientId: formData.clientId!,
        category: formData.category!,
        type: formData.type!,
        title: formData.title!,
        description: formData.description || undefined,
        value: parsedValue,
        period: formData.period || undefined,
        targetValue: parsedTargetValue,
        sortOrder: formData.sortOrder || 1,
      };

      await onSubmit(submitData);
      
      // Reset form
      setFormData({
        category: defaultCategory,
        clientId: defaultClientId || '',
        type: '',
        title: '',
        description: '',
        period: 'current',
        sortOrder: 1,
      });
      setValueInput('');
      setTargetValueInput('');
      onOpenChange(false);
    } catch (err) {
      console.error('Error submitting insight:', err);
      setError(err instanceof Error ? err.message : 'Failed to create insight');
    } finally {
      setLoading(false);
    }
  };

  const availableTypes = INSIGHT_TYPES[formData.category || 'METRIC'] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Insight</DialogTitle>
          <DialogDescription>
            Create a new insight entry for your client portfolio.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData(prev => ({ 
                  ...prev, 
                  category: value,
                  type: '' // Reset type when category changes
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="METRIC">Metric</SelectItem>
                  <SelectItem value="REVENUE">Revenue</SelectItem>
                  <SelectItem value="RISK">Risk</SelectItem>
                  <SelectItem value="OPPORTUNITY">Opportunity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Select
                value={formData.period}
                onValueChange={(value) => setFormData(prev => ({ ...prev, period: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter insight title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Value *</Label>
            <Textarea
              id="value"
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              placeholder="Enter value (number, JSON object, or text)"
              rows={3}
            />
            <div className="text-xs text-muted-foreground">
              Examples: 45000, {"amount": 45000, "currency": "USD"}, {"count": 150}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetValue">Target Value (Optional)</Label>
            <Textarea
              id="targetValue"
              value={targetValueInput}
              onChange={(e) => setTargetValueInput(e.target.value)}
              placeholder="Enter target value"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Input
              id="sortOrder"
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 1 }))}
              placeholder="1"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Insight'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}