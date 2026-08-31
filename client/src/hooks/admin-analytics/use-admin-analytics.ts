import { useCallback, useEffect, useState } from 'react';
import { adminAnalyticsApi, type AdminAnalytics } from 'src/api/admin-analytics';

interface UseAdminAnalyticsResult {
  analytics: AdminAnalytics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useAdminAnalytics = (): UseAdminAnalyticsResult => {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminAnalyticsApi.getAnalytics();
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, isLoading, error, refetch: fetchAnalytics };
};
