// src/features/purchases/hooks/use-purchases.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface PurchaseItem {
  productId: string;
  productName: string;
  inputUnit: string;
  inputQuantity: number;
  quantityKg: number;
  ratePaisePerKg: number;
  totalAmountPaise: number;
}

export interface Purchase {
  _id: string;
  transactionNumber: string;
  supplierId?: string;
  supplierName?: string;
  items: PurchaseItem[];
  totalAmountPaise: number;
  paidAmountPaise: number;
  pendingAmountPaise: number;
  paymentMethod: string;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface CreatePurchaseInput {
  supplierId?: string;
  items: {
    productId: string;
    inputUnit: string;
    inputQuantity: number;
    ratePaisePerKg: number;
  }[];
  paidAmountPaise: number;
  paymentMethod: string;
  notes?: string;
  date?: string;
}

export function usePurchases(options: { startDate?: string; endDate?: string; supplierId?: string } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["purchases", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.startDate) params.append("startDate", options.startDate);
      if (options.endDate) params.append("endDate", options.endDate);
      if (options.supplierId) params.append("supplierId", options.supplierId);

      const endpoint = `/purchases${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await api.get<{ success: boolean; data: Purchase[] }>(endpoint);
      return res.data;
    },
  });

  const createPurchase = useMutation({
    mutationFn: async (data: CreatePurchaseInput) => {
      const res = await api.post<{ success: boolean; data: Purchase }>("/purchases", data);
      return res.data;
    },
    onSuccess: () => {
      // Prefix keys: invalidates every variant (filters, ids, dates) of each query.
      [
        "purchases",
        "products",
        "inventory",
        "suppliers",
        "supplier",
        "payments",
        "dashboard",
        "reports",
        "daily-closing",
      ].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    },
  });

  return {
    purchases: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createPurchase,
  };
}
