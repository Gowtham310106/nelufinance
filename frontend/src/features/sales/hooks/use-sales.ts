// src/features/sales/hooks/use-sales.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface SaleItem {
  productId: string;
  productName: string;
  inputUnit: string;
  inputQuantity: number;
  quantityKg: number;
  ratePaisePerKg: number;
  totalAmountPaise: number;
  costPaisePerKgSnapshot: number;
  totalCostPaise: number;
}

export interface Sale {
  _id: string;
  transactionNumber: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  totalAmountPaise: number;
  receivedAmountPaise: number;
  creditAmountPaise: number;
  totalCostPaise: number;
  grossProfitPaise: number;
  paymentMethod: string;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface CreateSaleInput {
  customerId?: string;
  items: {
    productId: string;
    inputUnit: string;
    inputQuantity: number;
    ratePaisePerKg: number;
  }[];
  receivedAmountPaise: number;
  paymentMethod: string;
  notes?: string;
  date?: string;
}

export function useSales(options: { startDate?: string; endDate?: string; customerId?: string } = {}) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["sales", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.startDate) params.append("startDate", options.startDate);
      if (options.endDate) params.append("endDate", options.endDate);
      if (options.customerId) params.append("customerId", options.customerId);

      const endpoint = `/sales${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await api.get<{ success: boolean; data: Sale[] }>(endpoint);
      return res.data;
    },
  });

  const createSale = useMutation({
    mutationFn: async (data: CreateSaleInput) => {
      const res = await api.post<{ success: boolean; data: Sale }>("/sales", data);
      return res.data;
    },
    onSuccess: () => {
      // Prefix keys: invalidates every variant (filters, ids, dates) of each query.
      [
        "sales",
        "products",
        "inventory",
        "customers",
        "customer",
        "customer-ledger",
        "vatti",
        "payments",
        "dashboard",
        "reports",
        "daily-closing",
      ].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    },
  });

  return {
    sales: listQuery.data || [],
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    error: listQuery.error,
    refetch: listQuery.refetch,
    createSale,
  };
}
