import type { ManagedUser } from '@libs/types';
import { useEffect, useState } from 'react';
import { usersApi } from 'src/api/users';

interface UseUserResult {
  user: ManagedUser | null;
  isLoading: boolean;
  error: string | null;
}

export const useUser = (userId?: number): UseUserResult => {
  const [user, setUser] = useState<ManagedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await usersApi.getUser(userId);
        setUser(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch user');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [userId]);

  return { user, isLoading, error };
};
