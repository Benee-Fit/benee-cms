'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/design-system/components/ui/dialog';
import { Button } from '@repo/design-system/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/design-system/components/ui/form';
import { Input } from '@repo/design-system/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { Card } from '@repo/design-system/components/ui/card';
import { AlertCircle, Upload, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@repo/design-system/components/ui/alert';

// Validation schema
const clientSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  policyNumber: z.string().min(1, 'Policy number is required'),
  renewalDate: z.string().min(1, 'Renewal date is required'),
  headcount: z.number().min(1, 'Headcount must be at least 1'),
  premium: z.number().min(0, 'Premium must be a positive number'),
  revenue: z.number().min(0, 'Revenue must be a positive number'),
  industry: z.string().min(1, 'Industry is required'),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const industries = [
  'Technology',
  'Agriculture',
  'Construction',
  'Healthcare',
  'Retail',
  'Finance',
  'Manufacturing',
  'Education',
  'Hospitality',
  'Logistics',
];

export function ClientWizard({ open, onClose, onSuccess }: ClientWizardProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      companyName: '',
      policyNumber: '',
      renewalDate: '',
      headcount: 0,
      premium: 0,
      revenue: 0,
      industry: '',
    },
  });

  const checkPolicyNumber = async (policyNumber: string) => {
    if (!policyNumber) return;
    
    try {
      const response = await fetch('/api/clients');
      const clients = await response.json();
      
      const exists = clients.some((client: any) => 
        client.policyNumber === policyNumber
      );
      
      if (exists) {
        setPolicyError('This policy number already exists');
      } else {
        setPolicyError(null);
      }
    } catch (err) {
      console.error('Error checking policy number:', err);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      const isValid = await form.trigger(['companyName', 'policyNumber', 'industry']);
      if (isValid && !policyError) {
        setStep(2);
      }
    } else if (step === 2) {
      const isValid = await form.trigger(['renewalDate', 'headcount', 'premium', 'revenue']);
      if (isValid) {
        setStep(3);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Create client
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create client');
      }

      const client = await response.json();
      setClientId(client.id);

      // Upload documents if any
      if (documents.length > 0) {
        for (const doc of documents) {
          const formData = new FormData();
          formData.append('file', doc);
          formData.append('documentType', 'general');
          formData.append('description', `Uploaded during client creation`);

          await fetch(`/api/clients/${client.id}/documents`, {
            method: 'POST',
            body: formData,
          });
        }
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setStep(1);
    setError(null);
    setPolicyError(null);
    setClientId(null);
    setDocuments([]);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Client - Step {step} of 3</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter company name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="policyNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Policy Number</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g., POL12345"
                          onChange={(e) => {
                            field.onChange(e);
                            checkPolicyNumber(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      {policyError && (
                        <p className="text-sm text-destructive">{policyError}</p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {industries.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Policy Details */}
            {step === 2 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="renewalDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Renewal Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="headcount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Headcount</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          placeholder="0"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="premium"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Premium ($)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          placeholder="0.00"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="revenue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revenue ($)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          placeholder="0.00"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Upload Documents */}
            {step === 3 && (
              <div className="space-y-4">
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-medium">Upload Documents</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Add any relevant documents for this client (optional)
                      </p>
                    </div>
                    
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="block w-full text-sm text-muted-foreground
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary file:text-primary-foreground
                        hover:file:bg-primary/90"
                    />
                    
                    {documents.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium">Selected files:</p>
                        <ul className="space-y-1">
                          {documents.map((doc, index) => (
                            <li key={index} className="flex items-center text-sm text-muted-foreground">
                              <Check className="mr-2 h-4 w-4 text-green-600" />
                              {doc.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={step === 1 ? handleClose : handleBack}
                disabled={isSubmitting}
              >
                {step === 1 ? 'Cancel' : 'Back'}
              </Button>
              
              <div className="space-x-2">
                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting || !!policyError}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Client'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}