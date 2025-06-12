'use client';

import React from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Separator } from '@repo/design-system/components/ui/separator';
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
  Shield
} from 'lucide-react';

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
  
  // Additional fields for detailed view
  // These will need to be added to the database model
  location?: string;
  companySize?: string;
  
  // Leadership Contacts
  ceoName?: string;
  ceoEmail?: string;
  cfoName?: string;
  cfoEmail?: string;
  chroName?: string;
  chroEmail?: string;
  planAdminName?: string;
  planAdminEmail?: string;
  
  // Broker Details
  assignedBroker?: string;
  leadSource?: string;
  brokerCommissionSplit?: number;
  individualSplits?: string;
  
  // Plan Insights
  planManagementFee?: number;
  splitWithAnotherBroker?: boolean;
  currentCarrier?: string;
  withCarrierSince?: string;
  planType?: string;
  
  // Revenue & Growth
  totalRevenueLTD?: number;
  yoyRevenueGrowth?: number;
  yoyHeadcountGrowth?: number;
}

interface ClientDetailViewProps {
  client: DetailedClient;
  onBack: () => void;
  isLoading?: boolean;
}

export function ClientDetailView({ client, onBack, isLoading }: ClientDetailViewProps) {
  if (isLoading) {
    return (
      <div className="container mx-auto pt-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading client details...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return 'N/A';
    return `$${amount.toLocaleString()}`;
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto pt-6 pb-8">
      {/* Header with Back Button */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{client.companyName}</h1>
          <p className="text-muted-foreground">Policy #{client.policyNumber}</p>
        </div>
        <Button 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Client Listing
        </Button>
      </div>

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
              <div>
                <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                <p className="font-medium">{client.companyName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Industry</p>
                <Badge variant="secondary">{client.industry}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {client.location || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Company Size</p>
                <p>{client.companySize || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date Added</p>
                <p className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(client.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Headcount</p>
                <p className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {client.headcount}
                </p>
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
              <div>
                <p className="text-sm font-medium text-muted-foreground">CEO</p>
                <p className="font-medium">{client.ceoName || 'Not specified'}</p>
                {client.ceoEmail && (
                  <p className="text-sm text-muted-foreground">{client.ceoEmail}</p>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">CFO</p>
                <p className="font-medium">{client.cfoName || 'Not specified'}</p>
                {client.cfoEmail && (
                  <p className="text-sm text-muted-foreground">{client.cfoEmail}</p>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">CHRO / Head of People</p>
                <p className="font-medium">{client.chroName || 'Not specified'}</p>
                {client.chroEmail && (
                  <p className="text-sm text-muted-foreground">{client.chroEmail}</p>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Plan Administrator</p>
                <p className="font-medium">{client.planAdminName || 'Not specified'}</p>
                {client.planAdminEmail && (
                  <p className="text-sm text-muted-foreground">{client.planAdminEmail}</p>
                )}
              </div>
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
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned Broker</p>
                <p className="flex items-center gap-1">
                  <UserCheck className="h-4 w-4" />
                  {client.assignedBroker || 'Not assigned'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lead Source</p>
                <p>{client.leadSource || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Broker Commission Split</p>
                <p>{client.brokerCommissionSplit ? `${client.brokerCommissionSplit}%` : 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Individual Splits</p>
                <p>{client.individualSplits || 'Not specified'}</p>
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
                <p>{formatCurrency(client.planManagementFee)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Split With Another Broker</p>
                <p className="flex items-center gap-2">
                  {client.splitWithAnotherBroker ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Yes</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>No</span>
                    </>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Carrier</p>
                <p className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  {client.currentCarrier || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">With Carrier Since</p>
                <p>{formatDate(client.withCarrierSince)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Plan Type</p>
                <Badge variant="outline">{client.planType || 'Not specified'}</Badge>
              </div>
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
    </div>
  );
}