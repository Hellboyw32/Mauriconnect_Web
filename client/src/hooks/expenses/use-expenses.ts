import { useCallback, useEffect, useState } from 'react';
import type { ExpenseFilters, ExpenseListResult } from '@libs/types';

import { expenseApi } from 'src/api/expense';

const EMPTY: ExpenseListResult = {
  Total: 0,
  TotalExcludingVAT: 0,
  TotalVAT: 0,
  TotalIncludingVAT: 0,
  Items: []
};

export const useExpenses = (filters: ExpenseFilters) => {
  const [data, setData] = useState<ExpenseListResult>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Re-fetch only when the filter *values* change, not on every new object.
  const key = JSON.stringify(filters);

  const fetchExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setData(await expenseApi.getExpenses(JSON.parse(key)));
    } catch (err) {
      setError(err.message || 'Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return { data, isLoading, error, refetch: fetchExpenses };
};
