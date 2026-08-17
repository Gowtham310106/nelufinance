// src/features/customers/hooks/use-vatti.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Customer } from "./use-customers";

export interface VattiCalculationResult {
  customer: Customer;
  principalPaise: number;
  monthlyRate: number;
  asOfDate: string;
  totalInterestPaise: number;
  totalDuePaise: number;
  breakdown: {
    date: string;
    transactionNumber?: string;
    description: string;
    principalPaise: number;
    days: number;
    months: number;
    interestPaise: number;
  }[];
}

export function useVatti(customerId: string, rate: number = 2.0, asOfDate?: string) {
  const query = useQuery({
    queryKey: ["vatti", customerId, rate, asOfDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("rate", rate.toString());
      if (asOfDate) params.append("asOfDate", asOfDate);

      const res = await api.get<{ success: boolean; data: VattiCalculationResult }>(
        `/customers/${customerId}/vatti?${params.toString()}`
      );
      return res.data;
    },
    enabled: !!customerId,
  });

  return {
    vatti: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
