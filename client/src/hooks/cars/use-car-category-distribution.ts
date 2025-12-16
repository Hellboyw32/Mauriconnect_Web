import { useCallback, useEffect, useState } from 'react';
import { carsApi } from 'src/api/car';
import { useMounted } from '../use-mounted';

interface CategoryDistribution {
  Category: string;
  TotalCars: number;
}

export const useCarCategoryDistribution = () => {
  const isMounted = useMounted();
  const [categories, setCategories] = useState<CategoryDistribution[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCategoryDistribution = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await carsApi.getCarCategoryDistribution();

      if (isMounted()) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching car category distribution:', err);
      if (isMounted()) {
        setCategories([]);
      }
    } finally {
      if (isMounted()) {
        setIsLoading(false);
      }
    }
  }, [isMounted]);

  useEffect(() => {
    fetchCategoryDistribution();
  }, [fetchCategoryDistribution]);

  return {
    categories,
    isLoading,
    refetch: fetchCategoryDistribution
  };
};
