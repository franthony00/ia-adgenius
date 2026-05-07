'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchDashboardData, CONNECTED_ACCOUNTS,
  type DashboardData, type ConnectedAccount,
} from '@/lib/dashboard-data';

export interface UseDashboardDataResult {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  /** True when showing demo/mock data (no real account selected) */
  isDemoMode: boolean;
  /** True if at least one ad platform has been connected via OAuth */
  hasConnectedAccounts: boolean;
  /** List of all connected ad accounts across platforms */
  connectedAccounts: ConnectedAccount[];
  /** Currently selected platform filter (null = all / demo) */
  selectedPlatform: string | null;
  /** Currently selected ad account ID (null = all / demo) */
  selectedAdAccount: string | null;
  setSelectedPlatform: (platform: string | null) => void;
  setSelectedAdAccount: (accountId: string | null) => void;
  refresh: () => void;
}

export function useDashboardData(): UseDashboardDataResult {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedAdAccount, setSelectedAdAccount] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const connectedAccounts = CONNECTED_ACCOUNTS;
  const hasConnectedAccounts = connectedAccounts.length > 0;
  const isDemoMode = !hasConnectedAccounts || !selectedAdAccount;

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchDashboardData(selectedPlatform, selectedAdAccount)
      .then(result => {
        if (!cancelled) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [selectedPlatform, selectedAdAccount, refreshKey]);

  return {
    data,
    isLoading,
    error,
    isDemoMode,
    hasConnectedAccounts,
    connectedAccounts,
    selectedPlatform,
    selectedAdAccount,
    setSelectedPlatform,
    setSelectedAdAccount,
    refresh,
  };
}
