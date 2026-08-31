import type { ManagedUsers, UserFilters } from '@libs/types';
import { useCallback, useEffect, useState } from 'react';
import { usersApi } from 'src/api/users';

interface UseUsersResult {
  users: ManagedUsers;
  isLoading: boolean;
  error: string | null;
  refetch: (filters?: UserFilters) => void;
}

export const useUsers = (filters?: UserFilters): UseUsersResult => {
  const [users, setUsers] = useState<ManagedUsers>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (currentFilters?: UserFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await usersApi.getUsers(currentFilters);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.username, filters?.userType, filters?.status]);

  const refetch = useCallback(
    (nextFilters?: UserFilters) => {
      fetchUsers(nextFilters ?? filters);
    },
    [fetchUsers, filters]
  );

  return { users, isLoading, error, refetch };
};
