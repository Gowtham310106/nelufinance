// src/features/adaku/hooks/use-adaku.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface AdakuImage {
  url: string;
  key: string;
  caption?: string;
  uploadedAt: string;
}

export interface AdakuKadanItem {
  _id: string;
  pledgeNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerAadhaar?: string;
  customerAddress?: string;
  itemType: "gold" | "silver" | "brass_metal" | "other";
  purityKarat: string;
  itemDescription: string;
  itemCount: number;
  grossWeightGrams: number;
  stoneWeightGrams: number;
  netWeightGrams: number;
  marketValuePaise: number;
  loanAmountPaise: number;
  monthlyVattiRate: number;
  lockerNumber?: string;
  images: AdakuImage[];
  status: "ACTIVE" | "PARTIALLY_PAID" | "REDEEMED" | "OVERDUE" | "AUCTIONED";
  pledgeDate: string;
  dueDate: string;
  redeemedDate?: string;
  totalInterestPaidPaise: number;
  notes?: string;
  createdAt: string;
}

export interface AdakuPaymentItem {
  _id: string;
  receiptNumber: string;
  adakuId: string;
  pledgeNumber: string;
  customerName: string;
  type: "INTEREST_ONLY" | "PRINCIPAL_REDUCTION" | "FULL_REDEMPTION";
  interestAmountPaise: number;
  principalAmountPaise: number;
  totalPaidPaise: number;
  monthsCovered?: number;
  paymentMethod: string;
  notes?: string;
  date: string;
}

export interface AdakuSummary {
  activePledgesCount: number;
  totalActiveLoansPaise: number;
  totalGoldGrams: number;
  totalGoldPavan: number;
  totalSilverGrams: number;
  monthlyExpectedVattiPaise: number;
}

export function useAdaku(options: { status?: string; search?: string } = {}) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["adaku", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.status && options.status !== "all") params.append("status", options.status);
      if (options.search) params.append("search", options.search);

      const endpoint = `/adaku${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await api.get<{ success: boolean; data: AdakuKadanItem[] }>(endpoint);
      return res.data;
    },
  });

  const summaryQuery = useQuery({
    queryKey: ["adaku", "summary"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: AdakuSummary }>("/adaku/summary");
      return res.data;
    },
  });

  const usePledgeDetail = (id: string) =>
    useQuery({
      queryKey: ["adaku", id],
      queryFn: async () => {
        const res = await api.get<{
          success: boolean;
          data: { pledge: AdakuKadanItem; payments: AdakuPaymentItem[] };
        }>(`/adaku/${id}`);
        return res.data;
      },
      enabled: !!id,
    });

  const usePledgeVatti = (id: string, asOfDate?: string) =>
    useQuery({
      queryKey: ["adaku", id, "vatti", asOfDate],
      queryFn: async () => {
        const params = asOfDate ? `?asOfDate=${asOfDate}` : "";
        const res = await api.get<{
          success: boolean;
          data: {
            pledge: AdakuKadanItem;
            asOfDate: string;
            days: number;
            months: number;
            principalPaise: number;
            monthlyVattiRate: number;
            grossInterestPaise: number;
            totalInterestPaidPaise: number;
            pendingInterestPaise: number;
            totalRedemptionAmountPaise: number;
          };
        }>(`/adaku/${id}/vatti${params}`);
        return res.data;
      },
      enabled: !!id,
    });

  const recordPayment = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        type: "INTEREST_ONLY" | "PRINCIPAL_REDUCTION" | "FULL_REDEMPTION";
        interestAmountPaise?: number;
        principalAmountPaise?: number;
        paymentMethod: string;
        monthsCovered?: number;
        notes?: string;
        date?: string;
      };
    }) => {
      const res = await api.post<{ success: boolean; data: AdakuPaymentItem }>(
        `/adaku/${id}/payments`,
        data
      );
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["adaku"] });
      queryClient.invalidateQueries({ queryKey: ["adaku", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return {
    pledges: listQuery.data || [],
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
    summary: summaryQuery.data,
    isSummaryLoading: summaryQuery.isLoading,
    usePledgeDetail,
    usePledgeVatti,
    recordPayment,
  };
}
