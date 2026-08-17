// src/features/dashboard/hooks/use-dashboard.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface DashboardMetrics {
  today: {
    salesAmountPaise: number;
    salesWeightKg: number;
    salesCount: number;
    cashReceivedPaise: number;
    creditSalesPaise: number;
    grossProfitPaise: number;
    purchasesAmountPaise: number;
    purchasesWeightKg: number;
    purchasesCount: number;
    expensesAmountPaise: number;
    netProfitPaise: number;
  };
  overall: {
    totalCustomerPendingPaise: number;
    totalSupplierPayablePaise: number;
    totalStockKg: number;
    totalValuationPaise: number;
    lowStockCount: number;
    lowStockProducts: {
      id: string;
      name: string;
      nameTamil?: string;
      currentStockKg: number;
      minimumStockKg: number;
    }[];
  };
  recentTransactions: {
    id: string;
    type: "SALE" | "PURCHASE" | "PAYMENT_RECEIVED" | "EXPENSE";
    transactionNumber: string;
    partyName: string;
    amountPaise: number;
    weightKg?: number;
    date: string;
  }[];
}

export function useDashboard() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: DashboardMetrics }>("/dashboard");
      return res.data;
    },
    refetchInterval: 30000, // auto-refresh every 30 seconds
  });

  return {
    metrics: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
