// src/features/inventory/hooks/use-inventory.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface InventoryItem {
  productId: string;
  name: string;
  nameTamil?: string;
  category: string;
  unit: string;
  currentStockKg: number;
  minimumStockKg: number;
  isLowStock: boolean;
  weightedAvgCostPaisePerKg: number;
  stockValuationPaise: number;
  purchasePricePaise: number;
  sellingPricePaise: number;
}

export interface InventoryOverview {
  items: InventoryItem[];
  totalStockKg: number;
  totalValuationPaise: number;
  lowStockCount: number;
}

export interface InventoryMovement {
  _id: string;
  productId: {
    _id: string;
    name: string;
    nameTamil?: string;
    unit: string;
  };
  type: string;
  quantityKg: number;
  balanceAfterKg: number;
  unitRatePaise?: number;
  referenceType?: string;
  referenceId?: string;
  employeeId?: {
    _id: string;
    name: string;
  };
  reason?: string;
  notes?: string;
  date: string;
}

export interface StockAdjustmentInput {
  productId: string;
  type: "ADJUSTMENT_IN" | "ADJUSTMENT_OUT";
  quantityKg: number;
  reason: string;
  notes?: string;
}

export function useInventory() {
  const queryClient = useQueryClient();

  const overviewQuery = useQuery({
    queryKey: ["inventory", "overview"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: InventoryOverview }>("/inventory");
      return res.data;
    },
  });

  const adjustStock = useMutation({
    mutationFn: async (data: StockAdjustmentInput) => {
      const res = await api.post<{ success: boolean; data: unknown }>("/inventory/adjustments", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  return {
    overview: overviewQuery.data,
    isLoading: overviewQuery.isLoading,
    isError: overviewQuery.isError,
    refetch: overviewQuery.refetch,
    adjustStock,
  };
}

export function useInventoryMovements(options: { productId?: string; type?: string } = {}) {
  return useQuery({
    queryKey: ["inventory", "movements", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.productId) params.append("productId", options.productId);
      if (options.type) params.append("type", options.type);

      const endpoint = `/inventory/movements${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await api.get<{ success: boolean; data: InventoryMovement[] }>(endpoint);
      return res.data;
    },
  });
}
