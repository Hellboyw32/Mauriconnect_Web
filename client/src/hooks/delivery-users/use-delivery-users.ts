import { useEffect, useState } from 'react';
import { deliveryUserApi } from 'src/api/delivery-user';
import type { DeliveryUsers } from '@libs/types';

interface UseDeliveryUsersResult {
  deliveryUsers: DeliveryUsers;
  isLoading: boolean;
  error: string | null;
}

export const useDeliveryUsers = (): UseDeliveryUsersResult => {
  const [deliveryUsers, setDeliveryUsers] = useState<DeliveryUsers>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDeliveryUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await deliveryUserApi.getDeliveryUsers();
        if (isMounted) {
          setDeliveryUsers(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch delivery users');
        }
        console.error('Error fetching delivery users:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDeliveryUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    deliveryUsers,
    isLoading,
    error
  };
};
