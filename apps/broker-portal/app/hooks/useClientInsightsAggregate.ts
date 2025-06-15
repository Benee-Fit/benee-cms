'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@repo/auth/client';

export interface AggregatedOverviewData {
  totalClients: number;
  totalRevenue: number;
  totalPremium: number;
  avgRevenue: number;
  avgPremium: number;
  metrics: any[];
}

export interface AggregatedRevenueData {
  insights: any[];
  topClients: any[];
  totalRevenue: number;
}

export interface AggregatedRiskData {
  riskInsights: any[];
  opportunityInsights: any[];
  upcomingRenewals: any[];
  riskCount: number;
  opportunityCount: number;
}

export interface GrowthData {
  chartData: Array<{
    month: string;
    revenue: number;
  }>;
  yoyGrowth: number;
  dataPoints: number;
}

export interface AggregatedData {
  overview?: AggregatedOverviewData;
  revenue?: AggregatedRevenueData;
  risk?: AggregatedRiskData;
  growth?: GrowthData;
}

export interface UseClientInsightsAggregateOptions {
  clientId?: string;
  section?: 'overview' | 'revenue' | 'risk';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseClientInsightsAggregateReturn {
  data: AggregatedData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useClientInsightsAggregate(
  options: UseClientInsightsAggregateOptions = {}
): UseClientInsightsAggregateReturn {
  const { user } = useUser();
  const [data, setData] = useState<AggregatedData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    clientId,
    section,
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
  } = options;

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    if (clientId) params.append('clientId', clientId);
    if (section) params.append('section', section);
    return params.toString();
  }, [clientId, section]);

  const fetchAggregatedData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = buildQueryParams();
      const response = await fetch(`/api/client-insights/aggregate?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch aggregated data: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data || {});
      } else {
        throw new Error(result.error || 'Failed to fetch aggregated data');
      }
    } catch (err) {
      console.error('Error fetching aggregated data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user, buildQueryParams]);

  // Initial fetch
  useEffect(() => {
    fetchAggregatedData();
  }, [fetchAggregatedData]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !user) return;

    const interval = setInterval(fetchAggregatedData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAggregatedData, user]);

  return {
    data,
    loading,
    error,
    refetch: fetchAggregatedData,
  };
}

// Helper hook for specific sections
export function useOverviewData(clientId?: string) {
  return useClientInsightsAggregate({ 
    clientId, 
    section: 'overview',
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds for overview
  });
}

export function useRevenueData(clientId?: string) {
  return useClientInsightsAggregate({ 
    clientId, 
    section: 'revenue',
    autoRefresh: true,
    refreshInterval: 60000, // 1 minute for revenue
  });
}

export function useRiskData(clientId?: string) {
  return useClientInsightsAggregate({ 
    clientId, 
    section: 'risk',
    autoRefresh: true,
    refreshInterval: 120000, // 2 minutes for risk data
  });
}