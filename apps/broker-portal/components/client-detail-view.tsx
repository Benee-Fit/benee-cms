'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Separator } from '@repo/design-system/components/ui/separator';
import { Input } from '@repo/design-system/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { Switch } from '@repo/design-system/components/ui/switch';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Handshake, 
  TrendingUp, 
  DollarSign,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  Crown,
  UserCheck,
  Briefcase,
  Shield,
  ArrowRight,
  Plus
} from 'lucide-react';
import { DocumentUpload } from './document-library/DocumentUpload';
import { DocumentList } from './document-library/DocumentList';
import { ClientWizard } from './client-wizard';

// Extended interface for detailed client view
interface DetailedClient {
  // Basic Info (existing)
  id: string;
  companyName: string;
  policyNumber: string;
  renewalDate: string;
  headcount: number;
  premium: number;
  revenue: number;
  industry: string;
  createdAt: string;
  
  // New database fields
  companyLocation?: string;
  companySize?: string;
  leadershipCEO?: string;
  leadershipCFO?: string;
  leadershipCHRO?: string;
  planAdmin?: string;
  assignedBroker?: string;
  leadSource?: string;
  brokerCommissionSplit?: number;
  individualSplits?: any;
  planManagementFee?: number;
  splitWithAnotherBroker?: boolean;
  currentCarrier?: string;
  withCarrierSince?: string;
  planType?: string;
  
  // Additional fields for UI (backward compatibility)
  location?: string;
  ceoName?: string;
  ceoEmail?: string;
  cfoName?: string;
  cfoEmail?: string;
  chroName?: string;
  chroEmail?: string;
  planAdminName?: string;
  planAdminEmail?: string;
  
  // Revenue & Growth
  totalRevenueLTD?: number;
  yoyRevenueGrowth?: number;
  yoyHeadcountGrowth?: number;
  
  // Documents
  documents?: any[];
  
  // Additional metadata
  brokerEmail?: string;
  
  // Parent-child relationships
  parent?: {
    id: string;
    companyName: string;
  };
  divisions?: {
    id: string;
    companyName: string;
    headcount: number;
    premium: number;
    revenue: number;
    renewalDate: string;
    industry: string;
    policyNumber: string;
    createdAt: string;
  }[];
  totalHeadcount?: number;
}

interface ClientDetailViewProps {
  client: DetailedClient;
  onBack: () => void;
  isLoading?: boolean;
}

export function ClientDetailView({ client, onBack, isLoading }: ClientDetailViewProps) {
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState(client);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddDivision, setShowAddDivision] = useState(false);

  useEffect(() => {
    setEditedClient(client);
  }, [client]);

  const handleUploadComplete = () => {
    setRefreshCounter(prev => prev + 1);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedClient(client);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedClient),
      });

      if (!response.ok) {
        throw new Error('Failed to update client');
      }

      // Refresh the client data
      window.location.reload();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditedClient(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderEditableField = (field: keyof DetailedClient, label: string, type: 'text' | 'select' | 'date' = 'text', options?: string[]) => {
    if (isEditing) {
      if (type === 'select' && options) {
        return (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
            <Select value={editedClient?.[field]?.toString() || ''} onValueChange={(value) => handleFieldChange(field, value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {options.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      }
      return (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
          <Input 
            type={type}
            value={editedClient?.[field]?.toString() || ''} 
            onChange={(e) => handleFieldChange(field, e.target.value)}
          />
        </div>
      );
    }
    return (
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="font-medium">{editedClient?.[field] || 'Not specified'}</p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto pt-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto pt-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Client not found</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) {
      return 'N/A';
    }
    return `$${amount.toLocaleString()}`;
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null) {
      return 'N/A';
    }
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) {
      return 'N/A';
    }
    // Extract just the date part if it's a full datetime string
    const datePart = dateString.split('T')[0];
    // Parse as YYYY-MM-DD and format without timezone issues
    const [year, month, day] = datePart.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString('en-US');
  };

  return (
    <div className="container mx-auto pt-6 pb-8">
      {/* Header with Back Button */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{client.companyName}</h1>
          <p className="text-muted-foreground">Policy #{client.policyNumber}</p>
          {client.parent && (
            <div className="flex items-center mt-2 text-sm text-blue-600">
              <span>Division of: </span>
              <button 
                onClick={() => window.location.href = `/clients/${client.parent?.id}`}
                className="ml-1 underline hover:text-blue-800 font-medium"
              >
                {client.parent.companyName}
              </button>
              <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          )}
          {client.divisions && client.divisions.length > 0 && (
            <div className="flex items-center mt-2 text-sm text-green-600">
              <Building2 className="mr-1 h-4 w-4" />
              <span>This company has {client.divisions.length} division{client.divisions.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button 
                onClick={handleEdit}
                variant="outline"
              >
                Edit Client
              </Button>
              <Button 
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Client Listing
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                onClick={handleCancel}
                variant="outline"
                disabled={isSaving}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 🏢 Divisions Section */}
      {client.divisions && client.divisions.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Divisions ({client.divisions.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddDivision(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Division
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {client.divisions.map((division) => (
                <div key={division.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                      <div>
                        <button 
                          className="font-semibold text-blue-600 hover:text-blue-800 text-left"
                          onClick={() => window.location.href = `/clients/${division.id}`}
                        >
                          {division.companyName}
                        </button>
                        <p className="text-sm text-muted-foreground">Policy: {division.policyNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Industry</p>
                        <p className="font-medium">{division.industry}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Headcount</p>
                        <p className="font-medium flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {division.headcount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="font-medium text-green-600">{formatCurrency(division.revenue)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        window.location.href = `/clients/${division.id}`;
                      }}
                      className="ml-4"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 💰 Revenue & Growth - Top Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue & Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">Current Premium</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(client.premium)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">Current Revenue</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(client.revenue)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">Total Revenue (LTD)</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(client.totalRevenueLTD)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">YOY Revenue Growth</p>
              <p className={`text-2xl font-bold ${
                (client.yoyRevenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercentage(client.yoyRevenueGrowth)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">YOY Headcount Growth</p>
              <p className={`text-2xl font-bold ${
                (client.yoyHeadcountGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercentage(client.yoyHeadcountGrowth)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 🏢 Client Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Client Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {renderEditableField('companyName', 'Company Name')}
              {renderEditableField('industry', 'Industry')}
              {renderEditableField('companyLocation', 'Location')}
              {renderEditableField('companySize', 'Company Size', 'select', ['Small (1-49)', 'Medium (50-199)', 'Large (200+)'])}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date Added</p>
                <p className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(editedClient?.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Headcount{client.divisions && client.divisions.length > 0 && ' (All Divisions)'}
                </p>
                {isEditing ? (
                  <Input 
                    type="number"
                    value={editedClient?.headcount || 0} 
                    onChange={(e) => handleFieldChange('headcount', Number.parseInt(e.target.value) || 0)}
                  />
                ) : (
                  <div>
                    <p className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {client.divisions && client.divisions.length > 0 
                        ? (client.divisions.reduce((total, div) => total + div.headcount, 0))
                        : (client.headcount || 0)
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 👤 Leadership Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Leadership Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {renderEditableField('leadershipCEO', 'CEO')}
              <Separator />
              {renderEditableField('leadershipCFO', 'CFO')}
              <Separator />
              {renderEditableField('leadershipCHRO', 'CHRO / Head of People')}
              <Separator />
              {renderEditableField('planAdmin', 'Plan Administrator')}
            </div>
          </CardContent>
        </Card>

        {/* 🤝 Broker Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5" />
              Broker Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {renderEditableField('assignedBroker', 'Assigned Broker')}
              {renderEditableField('leadSource', 'Lead Source')}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Broker Commission Split</p>
                {isEditing ? (
                  <Input 
                    type="number"
                    value={editedClient?.brokerCommissionSplit || ''} 
                    onChange={(e) => handleFieldChange('brokerCommissionSplit', Number.parseFloat(e.target.value) || null)}
                    placeholder="Enter percentage"
                  />
                ) : (
                  <p>{editedClient?.brokerCommissionSplit ? `${editedClient.brokerCommissionSplit}%` : 'Not specified'}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Split With Another Broker</p>
                {isEditing ? (
                  <Switch 
                    checked={editedClient?.splitWithAnotherBroker || false} 
                    onCheckedChange={(checked) => handleFieldChange('splitWithAnotherBroker', checked)}
                  />
                ) : (
                  <p>{editedClient?.splitWithAnotherBroker ? 'Yes' : 'No'}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 📈 Plan Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Plan Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Plan Management Fee</p>
                {isEditing ? (
                  <Input 
                    type="number"
                    value={editedClient?.planManagementFee || ''} 
                    onChange={(e) => handleFieldChange('planManagementFee', Number.parseFloat(e.target.value) || null)}
                    placeholder="Enter amount"
                  />
                ) : (
                  <p>{formatCurrency(editedClient?.planManagementFee)}</p>
                )}
              </div>
              {renderEditableField('currentCarrier', 'Current Carrier')}
              <div>
                <p className="text-sm font-medium text-muted-foreground">With Carrier Since</p>
                {isEditing ? (
                  <Input 
                    type="date"
                    value={editedClient?.withCarrierSince ? new Date(editedClient.withCarrierSince).toISOString().split('T')[0] : ''} 
                    onChange={(e) => handleFieldChange('withCarrierSince', e.target.value)}
                  />
                ) : (
                  <p>{formatDate(editedClient?.withCarrierSince)}</p>
                )}
              </div>
              {renderEditableField('planType', 'Plan Type', 'select', ['PPO', 'HMO', 'HDHP', 'EPO', 'POS', 'Other'])}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Renewal Date</p>
                <p className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(client.renewalDate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>


      {/* 📄 Document Library */}
      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-4">Document Library</h2>
        <p className="text-muted-foreground mb-6">
          Access all important documents related to {client.companyName}. This library contains plan booklets, invoices, renewal documents, compliance notices, and other essential files.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document upload section */}
          <div className="lg:col-span-1">
            <DocumentUpload clientId={client.id} onUploadComplete={handleUploadComplete} />
          </div>
          
          {/* Document list section */}
          <div className="lg:col-span-2">
            <DocumentList clientId={client.id} refreshTrigger={refreshCounter} />
          </div>
        </div>
      </div>

      {/* Add Division Modal */}
      {showAddDivision && (
        <ClientWizard
          open={showAddDivision}
          onClose={() => setShowAddDivision(false)}
          parentId={client.id}
          onSuccess={() => {
            setShowAddDivision(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}