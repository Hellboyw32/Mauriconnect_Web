import { useCallback, useEffect, useState } from 'react';
import type { Expense } from '@libs/types';

import { expenseApi } from 'src/api/expense';

export const useExpense = (expenseId: number | undefined) => {
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpense = useCallback(async () => {
    if (!expenseId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setExpense(await expenseApi.getExpense(expenseId));
    } catch (err) {
      setExpense(null);
      setError(err.message || 'Failed to load the expense');
    } finally {
      setIsLoading(false);
    }
  }, [expenseId]);

  useEffect(() => {
    fetchExpense();
  }, [fetchExpense]);

  return { expense, isLoading, error, refetch: fetchExpense };
};
