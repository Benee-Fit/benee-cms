'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@repo/auth/client';

export interface ClientInsightData {
  id: string;
  clientId: string;
  category: 'METRIC' | 'REVENUE' | 'RISK' | 'OPPORTUNITY';
  type: string;
  title: string;
  description?: string;
  value: any;
  metadata?: any;
  period?: string;
  targetValue?: any;
  isActive: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    companyName: string;
    policyNumber: string;
  };
  timeSeries?: TimeSeriesData[];
}

export interface TimeSeriesData {
  id: string;
  insightId: string;
  date: string;
  value: any;
  metadata?: any;
  createdAt: string;
}

export interface UseClientInsightsOptions {
  clientId?: string;
  category?: string;
  type?: string;
  period?: string;
  includeTimeSeries?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseClientInsightsReturn {
  insights: ClientInsightData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createInsight: (data: Partial<ClientInsightData>) => Promise<ClientInsightData | null>;
  updateInsight: (id: string, data: Partial<ClientInsightData>) => Promise<ClientInsightData | null>;
  deleteInsight: (id: string) => Promise<boolean>;
  bulkCreate: (items: Partial<ClientInsightData>[]) => Promise<ClientInsightData[]>;
  bulkUpdate: (items: { id: string; data: Partial<ClientInsightData> }[]) => Promise<ClientInsightData[]>;
  bulkDelete: (ids: string[]) => Promise<boolean>;
}

export function useClientInsights(options: UseClientInsightsOptions = {}): UseClientInsightsReturn {
  const { user } = useUser();
  const [insights, setInsights] = useState<ClientInsightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    clientId,
    category,
    type,
    period,
    includeTimeSeries = false,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = options;

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    if (clientId) params.append('clientId', clientId);
    if (category) params.append('category', category);
    if (type) params.append('type', type);
    if (period) params.append('period', period);
    if (includeTimeSeries) params.append('includeTimeSeries', 'true');
    return params.toString();
  }, [clientId, category, type, period, includeTimeSeries]);

  const fetchInsights = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = buildQueryParams();
      const response = await fetch(`/api/client-insights?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch insights: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setInsights(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch insights');
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user, buildQueryParams]);

  const createInsight = useCallback(async (data: Partial<ClientInsightData>): Promise<ClientInsightData | null> => {
    if (!user) return null;

    try {
      const response = await fetch('/api/client-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Optimistic update
        setInsights(prev => [...prev, result.data]);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create insight');
      }
    } catch (err) {
      console.error('Error creating insight:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, [user]);

  const updateInsight = useCallback(async (id: string, data: Partial<ClientInsightData>): Promise<ClientInsightData | null> => {
    if (!user) return null;

    try {
      // Optimistic update
      setInsights(prev => prev.map(insight => 
        insight.id === id ? { ...insight, ...data } : insight
      ));

      const response = await fetch('/api/client-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id,
          data,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setInsights(prev => prev.map(insight => 
          insight.id === id ? result.data : insight
        ));
        return result.data;
      } else {
        // Revert optimistic update
        await fetchInsights();
        throw new Error(result.error || 'Failed to update insight');
      }
    } catch (err) {
      console.error('Error updating insight:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, [user, fetchInsights]);

  const deleteInsight = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Optimistic update
      const originalInsights = insights;
      setInsights(prev => prev.filter(insight => insight.id !== id));

      const response = await fetch('/api/client-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id,
        }),
      });

      const result = await response.json();
      if (result.success) {
        return true;
      } else {
        // Revert optimistic update
        setInsights(originalInsights);
        throw new Error(result.error || 'Failed to delete insight');
      }
    } catch (err) {
      console.error('Error deleting insight:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [user, insights]);

  const bulkCreate = useCallback(async (items: Partial<ClientInsightData>[]): Promise<ClientInsightData[]> => {
    if (!user) return [];

    try {
      const response = await fetch('/api/client-insights/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'create',
          items,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setInsights(prev => [...prev, ...result.data]);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to bulk create insights');
      }
    } catch (err) {
      console.error('Error bulk creating insights:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    }
  }, [user]);

  const bulkUpdate = useCallback(async (items: { id: string; data: Partial<ClientInsightData> }[]): Promise<ClientInsightData[]> => {
    if (!user) return [];

    try {
      const response = await fetch('/api/client-insights/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'update',
          items,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setInsights(prev => prev.map(insight => {
          const updated = result.data.find((item: ClientInsightData) => item.id === insight.id);
          return updated || insight;
        }));
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to bulk update insights');
      }
    } catch (err) {
      console.error('Error bulk updating insights:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    }
  }, [user]);

  const bulkDelete = useCallback(async (ids: string[]): Promise<boolean> => {
    if (!user) return false;

    try {
      // Optimistic update
      const originalInsights = insights;
      setInsights(prev => prev.filter(insight => !ids.includes(insight.id)));

      const response = await fetch('/api/client-insights/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'delete',
          ids,
        }),
      });

      const result = await response.json();
      if (result.success) {
        return true;
      } else {
        // Revert optimistic update
        setInsights(originalInsights);
        throw new Error(result.error || 'Failed to bulk delete insights');
      }
    } catch (err) {
      console.error('Error bulk deleting insights:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [user, insights]);

  // Initial fetch
  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !user) return;

    const interval = setInterval(fetchInsights, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchInsights, user]);

  return {
    insights,
    loading,
    error,
    refetch: fetchInsights,
    createInsight,
    updateInsight,
    deleteInsight,
    bulkCreate,
    bulkUpdate,
    bulkDelete,
  };
}