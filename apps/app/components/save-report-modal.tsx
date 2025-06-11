'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/design-system/components/ui/dialog';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Textarea } from '@repo/design-system/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { Save, Check } from 'lucide-react';
import { toast } from 'sonner';

interface SaveReportModalProps {
  reportData: any; // The processed report data
  documentIds?: string[];
  onSaved?: (reportId: string) => void;
  children?: React.ReactNode;
}

interface BrokerClient {
  id: string;
  companyName: string;
}

export default function SaveReportModal({ 
  reportData, 
  documentIds = [], 
  onSaved,
  children 
}: SaveReportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [clients, setClients] = useState<BrokerClient[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    notes: '',
  });


  const loadClients = async () => {
    setLoadingClients(true);
    try {
      // This would need to be implemented - fetching user's clients
      // const response = await fetch('/api/clients');
      // const data = await response.json();
      // setClients(data.clients || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && clients.length === 0) {
      loadClients();
    }
    if (!open) {
      // Reset form when closed
      setFormData({ title: '', clientId: '', notes: '' });
      setIsSaved(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Report title is required');
      return;
    }

    setIsLoading(true);
    try {
      const requestData = {
        title: formData.title,
        clientId: formData.clientId && formData.clientId !== 'no-client' ? formData.clientId : null,
        data: reportData,
        documentIds,
        notes: formData.notes,
      };
      
      console.log('[DEBUG] SaveReportModal - Making API request with data:', requestData);
      
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('[DEBUG] SaveReportModal - API response status:', response.status);
      console.log('[DEBUG] SaveReportModal - API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DEBUG] SaveReportModal - API error response:', errorText);
        throw new Error(`Failed to save report: ${response.status} ${errorText}`);
      }

      const savedReport = await response.json();
      console.log('[DEBUG] SaveReportModal - Saved report:', savedReport);
      
      setIsSaved(true);
      toast.success('Report saved successfully');

      onSaved?.(savedReport.id);
      
      // Close modal after a brief delay
      setTimeout(() => {
        setIsOpen(false);
      }, 1500);

    } catch (error) {
      console.error('[DEBUG] SaveReportModal - Error during save:', error);
      if (error instanceof Error) {
        console.error('[DEBUG] SaveReportModal - Error message:', error.message);
        console.error('[DEBUG] SaveReportModal - Error stack:', error.stack);
      }
      toast.error(`Failed to save report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Quote Report</DialogTitle>
        </DialogHeader>
        
        {isSaved ? (
          <div className="flex flex-col items-center py-6">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Report Saved!</h3>
            <p className="text-sm text-gray-600 text-center">
              Your quote report has been saved successfully.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Report Title *</Label>
              <Input
                id="title"
                placeholder="Enter report title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Associated Client (Optional)</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => setFormData({ ...formData, clientId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-client">No client selected</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loadingClients && (
                <p className="text-xs text-gray-500">Loading clients...</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || !formData.title.trim()}
              >
                {isLoading ? 'Saving...' : 'Save Report'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}