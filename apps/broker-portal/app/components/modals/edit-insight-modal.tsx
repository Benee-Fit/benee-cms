'use client';

import { useState, useEffect } from 'react';
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
import { ClientInsightData } from '../../hooks/useClientInsights';

interface EditInsightModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, data: Partial<ClientInsightData>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  insight: ClientInsightData | null;
}

const PERIODS = [
  { value: 'current', label: 'Current' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
  { value: 'ytd', label: 'Year to Date' },
];

export function EditInsightModal({
  open,
  onOpenChange,
  onSubmit,
  onDelete,
  insight,
}: EditInsightModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    period: 'current',
    sortOrder: 1,
    isActive: true,
  });

  const [valueInput, setValueInput] = useState('');
  const [targetValueInput, setTargetValueInput] = useState('');

  // Update form data when insight changes
  useEffect(() => {
    if (insight) {
      setFormData({
        title: insight.title || '',
        description: insight.description || '',
        period: insight.period || 'current',
        sortOrder: insight.sortOrder || 1,
        isActive: insight.isActive,
      });
      
      // Format value and targetValue for editing
      setValueInput(JSON.stringify(insight.value, null, 2));
      setTargetValueInput(insight.targetValue ? JSON.stringify(insight.targetValue, null, 2) : '');
    }
  }, [insight]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!insight || !formData.title) {
      setError('Title is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Parse value and targetValue
      let parsedValue = {};
      let parsedTargetValue = undefined;

      try {
        parsedValue = JSON.parse(valueInput);
        if (targetValueInput.trim()) {
          parsedTargetValue = JSON.parse(targetValueInput);
        }
      } catch (parseError) {
        throw new Error('Invalid JSON format in value fields');
      }

      const updateData = {
        title: formData.title,
        description: formData.description || undefined,
        value: parsedValue,
        period: formData.period || undefined,
        targetValue: parsedTargetValue,
        sortOrder: formData.sortOrder,
        isActive: formData.isActive,
      };

      await onSubmit(insight.id, updateData);
      onOpenChange(false);
    } catch (err) {
      console.error('Error updating insight:', err);
      setError(err instanceof Error ? err.message : 'Failed to update insight');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!insight || !onDelete) return;
    
    if (!confirm(`Are you sure you want to delete "${insight.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      await onDelete(insight.id);
      onOpenChange(false);
    } catch (err) {
      console.error('Error deleting insight:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete insight');
    } finally {
      setDeleting(false);
    }
  };

  if (!insight) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Insight</DialogTitle>
          <DialogDescription>
            Update the insight details for {insight.client.companyName}.
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
              <Label>Client</Label>
              <Input value={insight.client.companyName} disabled />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={insight.category} disabled />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Input value={insight.type} disabled />
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
              placeholder="Enter value as JSON"
              rows={4}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetValue">Target Value</Label>
            <Textarea
              id="targetValue"
              value={targetValueInput}
              onChange={(e) => setTargetValueInput(e.target.value)}
              placeholder="Enter target value as JSON"
              rows={3}
              className="font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <Select
                value={formData.isActive ? 'active' : 'inactive'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value === 'active' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading || deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading || deleting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || deleting}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Insight'
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}