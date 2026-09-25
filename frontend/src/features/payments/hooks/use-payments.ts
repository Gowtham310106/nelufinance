// src/features/payments/hooks/use-payments.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface Payment {
  _id: string;
  transactionNumber: string;
  type: "RECEIVED" | "GIVEN";
  partyType: "CUSTOMER" | "SUPPLIER";
  partyId: string;
  partyName: string;
  amountPaise: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface CreatePaymentInput {
  type: "RECEIVED" | "GIVEN";
  partyType: "CUSTOMER" | "SUPPLIER";
  partyId: string;
  amountPaise: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  date?: string;
}

export function usePayments(options: { type?: string; partyType?: string; partyId?: string } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["payments", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.type) params.append("type", options.type);
      if (options.partyType) params.append("partyType", options.partyType);
      if (options.partyId) params.append("partyId", options.partyId);

      const endpoint = `/payments${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await api.get<{ success: boolean; data: Payment[] }>(endpoint);
      return res.data;
    },
  });

  const recordPayment = useMutation({
    mutationFn: async (data: CreatePaymentInput) => {
      const res = await api.post<{ success: boolean; data: Payment }>("/payments", data);
      return res.data;
    },
    onSuccess: (_, vars) => {
      const keys = ["payments", "dashboard", "daily-closing", "reports"];
      if (vars.partyType === "CUSTOMER") {
        keys.push("customers", "customer", "customer-ledger", "vatti");
      } else if (vars.partyType === "SUPPLIER") {
        keys.push("suppliers", "supplier");
      }
      keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    },
  });

  return {
    payments: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    recordPayment,
  };
}
