// src/features/customers/hooks/use-customers.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  address?: string;
  openingBalancePaise: number;
  currentBalancePaise: number;
  interestRate?: number;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface CustomerLedgerEntry {
  id: string;
  date: string;
  type: "OPENING_BALANCE" | "SALE" | "PAYMENT_RECEIVED";
  transactionNumber?: string;
  description: string;
  debitPaise: number;
  creditPaise: number;
  runningBalancePaise: number;
}

export interface CustomerLedgerResponse {
  customer: Customer;
  entries: CustomerLedgerEntry[];
  totalDebitPaise: number;
  totalCreditPaise: number;
  finalBalancePaise: number;
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  address?: string;
  openingBalancePaise?: number;
  interestRate?: number;
  notes?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string;
  address?: string;
  interestRate?: number;
  notes?: string;
  active?: boolean;
}

export function useCustomers(options: { search?: string } = {}) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["customers", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.search) params.append("search", options.search);

      const endpoint = `/customers${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await api.get<{ success: boolean; data: Customer[] }>(endpoint);
      return res.data;
    },
  });

  const useCustomerDetail = (customerId: string) =>
    useQuery({
      queryKey: ["customer", customerId],
      queryFn: async () => {
        const res = await api.get<{ success: boolean; data: Customer }>(`/customers/${customerId}`);
        return res.data;
      },
      enabled: !!customerId,
    });

  const useCustomerLedger = (customerId: string) =>
    useQuery({
      queryKey: ["customer-ledger", customerId],
      queryFn: async () => {
        const res = await api.get<{ success: boolean; data: CustomerLedgerResponse }>(
          `/customers/${customerId}/ledger`
        );
        return res.data;
      },
      enabled: !!customerId,
    });

  const createCustomer = useMutation({
    mutationFn: async (data: CreateCustomerInput) => {
      const res = await api.post<{ success: boolean; data: Customer }>("/customers", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const updateCustomer = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCustomerInput }) => {
      const res = await api.put<{ success: boolean; data: Customer }>(`/customers/${id}`, data);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
      queryClient.invalidateQueries({ queryKey: ["customer-ledger", id] });
    },
  });

  return {
    customers: listQuery.data || [],
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    error: listQuery.error,
    refetch: listQuery.refetch,
    useCustomerDetail,
    useCustomerLedger,
    createCustomer,
    updateCustomer,
  };
}
