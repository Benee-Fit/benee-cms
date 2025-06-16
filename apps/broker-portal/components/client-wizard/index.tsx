'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/design-system/components/ui/dialog';
import { Button } from '@repo/design-system/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/design-system/components/ui/form';
import { Input } from '@repo/design-system/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { Card } from '@repo/design-system/components/ui/card';
import { AlertCircle, Upload, Check, Building2, Users, Search } from 'lucide-react';
import { Alert, AlertDescription } from '@repo/design-system/components/ui/alert';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';

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
  parentId?: string | null;
  title?: string;
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

export function ClientWizard({ open, onClose, onSuccess, parentId, title = "Add New Client" }: ClientWizardProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [hasDivisions, setHasDivisions] = useState<string>('no');
  const [availableClients, setAvailableClients] = useState<any[]>([]);
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [divisionSearchTerm, setDivisionSearchTerm] = useState('');

  const form = useForm<any>({
    resolver: zodResolver(clientSchema),
    mode: 'onChange',
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

  const loadAvailableClients = async () => {
    setIsLoadingClients(true);
    try {
      const response = await fetch('/api/clients');
      const clients = await response.json();
      // Filter out clients that already have a parent (are already divisions)
      const availableForDivisions = clients.filter((client: any) => !client.parentId);
      setAvailableClients(availableForDivisions);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const checkPolicyNumber = async (policyNumber: string) => {
    if (!policyNumber) {
      return;
    }
    
    try {
      const response = await fetch('/api/clients');
      const clients = await response.json();
      
      const exists = clients.some((client: { policyNumber: string }) => 
        client.policyNumber === policyNumber
      );
      
      if (exists) {
        setPolicyError('This policy number already exists');
      } else {
        setPolicyError(null);
      }
    } catch {
      // Silently handle policy number check errors
    }
  };

  const handleNext = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (step === 1) {
      // Check individual field validity for step 1
      const companyName = form.getValues('companyName');
      const policyNumber = form.getValues('policyNumber');
      const industry = form.getValues('industry');
      
      if (companyName && policyNumber && industry && !policyError) {
        if (hasDivisions === 'yes') {
          // Load available clients for division selection
          await loadAvailableClients();
          setStep(2); // Go to division selection step
        } else {
          setStep(3); // Skip division selection, go to policy details
        }
      } else {
        // Trigger validation to show errors
        await form.trigger(['companyName', 'policyNumber', 'industry']);
      }
    } else if (step === 2 && hasDivisions === 'yes') {
      // Division selection step - require at least one division selected
      if (selectedDivisions.length > 0) {
        setStep(3); // Go to policy details
      } else {
        setError('Please select at least one division');
      }
    } else if (step === 3) {
      // Check individual field validity for policy details
      const renewalDate = form.getValues('renewalDate');
      const headcount = form.getValues('headcount');
      const premium = form.getValues('premium');
      const revenue = form.getValues('revenue');
      
      if (renewalDate && headcount > 0 && premium >= 0 && revenue >= 0) {
        setStep(4); // Go to document upload
      } else {
        // Trigger validation to show errors
        await form.trigger(['renewalDate', 'headcount', 'premium', 'revenue']);
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
      const clientData = {
        ...data,
        parentId: parentId || null,
      };
      
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create client');
      }

      const client = await response.json();

      // If divisions were selected, convert them to divisions of this client
      if (hasDivisions === 'yes' && selectedDivisions.length > 0) {
        for (const divisionId of selectedDivisions) {
          const divisionResponse = await fetch(`/api/clients/${divisionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parentId: client.id }),
          });

          if (!divisionResponse.ok) {
            console.error(`Failed to convert client ${divisionId} to division`);
          }
        }
      }

      // Upload documents if any
      if (documents.length > 0) {
        for (const doc of documents) {
          const formData = new FormData();
          formData.append('file', doc);
          formData.append('documentType', 'general');
          formData.append('description', 'Uploaded during client creation');

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
    setDocuments([]);
    setHasDivisions('no');
    setSelectedDivisions([]);
    setAvailableClients([]);
    setDivisionSearchTerm('');
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
          <DialogTitle>{title} - Step {step} of {hasDivisions === 'yes' ? '4' : '3'}</DialogTitle>
          {parentId && (
            <p className="text-sm text-muted-foreground">
              Creating a division under the selected holding company
            </p>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Only allow submission on final step
            const finalStep = hasDivisions === 'yes' ? 4 : 3;
            if (step === finalStep) {
              form.handleSubmit(handleSubmit)(e);
            }
          }} className="space-y-6">
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

                {/* Only show division question for new clients (not when adding a division) */}
                {!parentId && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Does this company have divisions?
                    </label>
                    <Select value={hasDivisions} onValueChange={setHasDivisions}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No - Single company</SelectItem>
                        <SelectItem value="yes">Yes - Has divisions</SelectItem>
                      </SelectContent>
                    </Select>
                    {hasDivisions === 'yes' && (
                      <div className="p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-800">
                          <Building2 className="inline h-4 w-4 mr-1" />
                          You'll be able to select existing clients as divisions in the next step.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Division Selection (only if hasDivisions === 'yes') */}
            {step === 2 && hasDivisions === 'yes' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Select Divisions
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choose which existing clients should become divisions of this holding company.
                  </p>
                </div>

                {isLoadingClients ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading available clients...</p>
                  </div>
                ) : (
                  <>
                    {/* Search bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search clients by name, policy number, or industry..."
                        value={divisionSearchTerm}
                        onChange={(e) => setDivisionSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {availableClients.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No available clients to convert to divisions.
                        </p>
                      ) : (
                        availableClients
                          .filter((client) => {
                            const searchLower = divisionSearchTerm.toLowerCase();
                            return (
                              client.companyName.toLowerCase().includes(searchLower) ||
                              client.policyNumber.toLowerCase().includes(searchLower) ||
                              client.industry.toLowerCase().includes(searchLower)
                            );
                          })
                          .map((client) => (
                        <div key={client.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <Checkbox
                            id={`client-${client.id}`}
                            checked={selectedDivisions.includes(client.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDivisions([...selectedDivisions, client.id]);
                              } else {
                                setSelectedDivisions(selectedDivisions.filter(id => id !== client.id));
                              }
                            }}
                          />
                          <label htmlFor={`client-${client.id}`} className="flex-1 cursor-pointer">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="font-medium">{client.companyName}</p>
                                <p className="text-sm text-muted-foreground">Policy: {client.policyNumber}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Industry</p>
                                <p className="font-medium">{client.industry}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Headcount</p>
                                <p className="font-medium flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {client.headcount?.toLocaleString() || 0}
                                </p>
                              </div>
                            </div>
                          </label>
                        </div>
                      ))
                    )}
                    {availableClients.length > 0 && 
                     availableClients.filter((client) => {
                       const searchLower = divisionSearchTerm.toLowerCase();
                       return (
                         client.companyName.toLowerCase().includes(searchLower) ||
                         client.policyNumber.toLowerCase().includes(searchLower) ||
                         client.industry.toLowerCase().includes(searchLower)
                       );
                     }).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No clients match your search criteria.
                      </p>
                    )}
                  </div>
                  </>
                )}

                {selectedDivisions.length > 0 && (
                  <div className="p-3 bg-green-50 rounded-md">
                    <p className="text-sm text-green-800">
                      Selected {selectedDivisions.length} division{selectedDivisions.length > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Policy Details */}
            {step === 3 && (
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
                          onChange={(e) => field.onChange(Number.parseInt(e.target.value, 10) || 0)}
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
                          step="0.01"
                          placeholder="0.00"
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
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
                          step="0.01"
                          placeholder="0.00"
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 4: Upload Documents */}
            {step === 4 && (
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
                {(() => {
                  const finalStep = hasDivisions === 'yes' ? 4 : 3;
                  return step < finalStep ? (
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
                  );
                })()}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}