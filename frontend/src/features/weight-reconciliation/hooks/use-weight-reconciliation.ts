// src/features/weight-reconciliation/hooks/use-weight-reconciliation.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface WeightReconciliationRecord {
  _id: string;
  transactionNumber: string;
  lorryNumber: string;
  driverName?: string;
  driverPhone?: string;
  supplierId?: string;
  supplierName?: string;
  productId: string;
  productName: string;
  grossWeightKg: number;
  tareWeightKg: number;
  netWeighbridgeWeightKg: number;
  bagCount: number;
  bagStandardWeightKg: number;
  bagCalculatedWeightKg: number;
  discrepancyKg: number;
  discrepancyPercentage: number;
  actionTaken: "ACCEPT_WEIGHBRIDGE" | "ACCEPT_BAG_COUNT" | "SPLIT_DIFFERENCE" | "DISPUTED";
  finalAcceptedWeightKg: number;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface CreateWeightReconciliationInput {
  lorryNumber: string;
  driverName?: string;
  driverPhone?: string;
  supplierId?: string;
  productId: string;
  grossWeightKg: number;
  tareWeightKg: number;
  bagCount: number;
  bagStandardWeightKg: number;
  actionTaken: "ACCEPT_WEIGHBRIDGE" | "ACCEPT_BAG_COUNT" | "SPLIT_DIFFERENCE" | "DISPUTED";
  notes?: string;
  date?: string;
}

export function useWeightReconciliation() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["weight-reconciliation"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: WeightReconciliationRecord[] }>(
        "/weight-reconciliation"
      );
      return res.data;
    },
  });

  const createRecord = useMutation({
    mutationFn: async (data: CreateWeightReconciliationInput) => {
      const res = await api.post<{ success: boolean; data: WeightReconciliationRecord }>(
        "/weight-reconciliation",
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-reconciliation"] });
    },
  });

  return {
    records: listQuery.data || [],
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
    createRecord,
  };
}
