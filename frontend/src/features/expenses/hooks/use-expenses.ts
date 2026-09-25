// src/features/expenses/hooks/use-expenses.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface Expense {
  _id: string;
  transactionNumber: string;
  category: string;
  amountPaise: number;
  paymentMethod: string;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface CreateExpenseInput {
  category: string;
  amountPaise: number;
  paymentMethod: string;
  notes?: string;
  date?: string;
}

export function useExpenses(options: { category?: string; startDate?: string; endDate?: string } = {}) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["expenses", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.category && options.category !== "all") params.append("category", options.category);
      if (options.startDate) params.append("startDate", options.startDate);
      if (options.endDate) params.append("endDate", options.endDate);

      const endpoint = `/expenses${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await api.get<{ success: boolean; data: Expense[] }>(endpoint);
      return res.data;
    },
  });

  const createExpense = useMutation({
    mutationFn: async (data: CreateExpenseInput) => {
      const res = await api.post<{ success: boolean; data: Expense }>("/expenses", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["daily-closing"] });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["daily-closing"] });
    },
  });

  return {
    expenses: listQuery.data || [],
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    error: listQuery.error,
    refetch: listQuery.refetch,
    createExpense,
    deleteExpense,
  };
}
