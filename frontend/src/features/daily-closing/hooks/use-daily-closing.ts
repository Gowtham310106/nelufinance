// src/features/daily-closing/hooks/use-daily-closing.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface DenominationCount {
  d500: number;
  d200: number;
  d100: number;
  d50: number;
  d20: number;
  d10: number;
  coins: number;
}

export interface DailyClosingRecord {
  _id: string;
  closingDate: string;
  openingCashPaise: number;
  cashSalesPaise: number;
  cashPaymentsReceivedPaise: number;
  cashPaymentsGivenPaise: number;
  cashExpensesPaise: number;
  expectedClosingCashPaise: number;
  actualCashInDrawerPaise: number;
  cashVariancePaise: number;
  denominations: DenominationCount;
  status: "OPEN" | "CLOSED" | "LOCKED";
  notes?: string;
  closedBy?: { _id: string; name: string };
  closedAt?: string;
  createdAt: string;
}

export interface DailyClosingPreview {
  closingDate: string;
  openingCashPaise: number;
  cashSalesPaise: number;
  cashPaymentsReceivedPaise: number;
  cashPaymentsGivenPaise: number;
  cashExpensesPaise: number;
  expectedClosingCashPaise: number;
  alreadyClosed: boolean;
  existingClosing?: DailyClosingRecord;
}

export interface SubmitDailyClosingInput {
  closingDate: string;
  openingCashPaise: number;
  denominations: DenominationCount;
  notes?: string;
}

export function useDailyClosing(dateStr?: string) {
  const queryClient = useQueryClient();

  const previewQuery = useQuery({
    queryKey: ["daily-closing", "preview", dateStr],
    queryFn: async () => {
      const params = dateStr ? `?date=${dateStr}` : "";
      const res = await api.get<{ success: boolean; data: DailyClosingPreview }>(
        `/daily-closing/preview${params}`
      );
      return res.data;
    },
  });

  const historyQuery = useQuery({
    queryKey: ["daily-closing", "history"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: DailyClosingRecord[] }>(
        "/daily-closing/history"
      );
      return res.data;
    },
  });

  const submitClosing = useMutation({
    mutationFn: async (data: SubmitDailyClosingInput) => {
      const res = await api.post<{ success: boolean; data: DailyClosingRecord }>(
        "/daily-closing/close",
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-closing"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return {
    preview: previewQuery.data,
    isPreviewLoading: previewQuery.isLoading,
    history: historyQuery.data || [],
    isHistoryLoading: historyQuery.isLoading,
    refetchPreview: previewQuery.refetch,
    submitClosing,
  };
}
