// src/features/reports/hooks/use-reports.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface ProfitLossReport {
  period: {
    startDate: string;
    endDate: string;
  };
  revenuePaise: number;
  cogsPaise: number;
  grossProfitPaise: number;
  grossMarginPercentage: number;
  expensesByCategory: {
    category: string;
    amountPaise: number;
    percentageOfExpenses: number;
  }[];
  totalExpensesPaise: number;
  netProfitPaise: number;
  netMarginPercentage: number;
}

export interface SalesAnalyticsReport {
  totalRevenuePaise: number;
  totalQuantityKg: number;
  totalGrossProfitPaise: number;
  salesCount: number;
  byProduct: {
    productId: string;
    productName: string;
    quantityKg: number;
    revenuePaise: number;
    profitPaise: number;
  }[];
  byCustomer: {
    customerId?: string;
    customerName: string;
    totalAmountPaise: number;
    paidAmountPaise: number;
    creditAmountPaise: number;
  }[];
}

export function useReports(options: { startDate?: string; endDate?: string } = {}) {
  const profitQuery = useQuery({
    queryKey: ["reports", "profit", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.startDate) params.append("startDate", options.startDate);
      if (options.endDate) params.append("endDate", options.endDate);

      const endpoint = `/reports/profit${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await api.get<{ success: boolean; data: ProfitLossReport }>(endpoint);
      return res.data;
    },
  });

  const salesQuery = useQuery({
    queryKey: ["reports", "sales", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.startDate) params.append("startDate", options.startDate);
      if (options.endDate) params.append("endDate", options.endDate);

      const endpoint = `/reports/sales${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await api.get<{ success: boolean; data: SalesAnalyticsReport }>(endpoint);
      return res.data;
    },
  });

  return {
    profitLoss: profitQuery.data,
    isProfitLoading: profitQuery.isLoading,
    salesAnalytics: salesQuery.data,
    isSalesLoading: salesQuery.isLoading,
    refetch: () => {
      profitQuery.refetch();
      salesQuery.refetch();
    },
  };
}
